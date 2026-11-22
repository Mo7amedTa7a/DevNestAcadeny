const Lesson = require('../lessons/lessons.model');
const LessonProgress = require('../lessons/lessonProgress.model');
const Enrollment = require('../enrollments/enrollments.model');
const Course = require('../courses/courses.model');
const { getCohortLeaderboard } = require('../leaderboard/leaderboard.service');
const { AppError } = require('../../utils/AppError');
const { generateVideoToken, verifyVideoToken: decryptToken } = require('../../utils/videoSecurity');
const { ENROLLMENT_STATUS, ERROR_CODES } = require('../../utils/constants');

/**
 * Get student dashboard data.
 * Computes course completion percentage, active enrollment, continue-learning target.
 *
 * @param {string} studentId
 */
const getStudentDashboard = async (studentId) => {
  // Find active enrollment
  const enrollment = await Enrollment.findOne({
    studentId,
    status: ENROLLMENT_STATUS.ACTIVE,
  })
    .populate('courseId')
    .lean();

  if (!enrollment || !enrollment.courseId) {
    return {
      hasActiveCourse: false,
      message: 'ليس لديك اشتراك نشط في أي كورس حالياً. يرجى التواصل مع الإدارة.',
    };
  }

  const course = enrollment.courseId;
  const courseId = course._id;

  // Published lessons query (only published lessons are accessible)
  const now = new Date();
  const publishedQuery = {
    courseId,
    isPublished: true,
    $or: [{ releaseDate: null }, { releaseDate: { $lte: now } }],
  };

  const [totalPublishedLessons, completedLessonsCount, lessons, allProgress] = await Promise.all([
    Lesson.countDocuments(publishedQuery),
    LessonProgress.countDocuments({ studentId, courseId, isCompleted: true }),
    Lesson.find(publishedQuery).sort({ order: 1 }).select('title moduleTitle moduleNumber order duration resources isPublished releaseDate').lean(),
    LessonProgress.find({ studentId, courseId }).lean(),
  ]);

  const progressPercentage =
    totalPublishedLessons > 0
      ? Math.round((completedLessonsCount / totalPublishedLessons) * 100)
      : 0;

  // Map progress to lessons
  const progressMap = {};
  allProgress.forEach((p) => {
    progressMap[p.lessonId.toString()] = p;
  });

  const enrichedLessons = lessons.map((l) => ({
    ...l,
    isCompleted: !!progressMap[l._id.toString()]?.isCompleted,
    lastPositionSeconds: progressMap[l._id.toString()]?.lastPositionSeconds || 0,
  }));

  // Find continue-learning lesson: first uncompleted lesson or first lesson
  const continueLesson =
    enrichedLessons.find((l) => !l.isCompleted) || enrichedLessons[0] || null;

  // Compute live rank among cohort peers
  let cohortRank = '-';
  if (enrollment.features?.showInLeaderboard) {
    try {
      const lb = await getCohortLeaderboard(studentId, courseId);
      cohortRank = lb.myRank?.rank ?? '-';
    } catch (_err) {
      cohortRank = '-';
    }
  }

  return {
    hasActiveCourse: true,
    enrollment: {
      id: enrollment._id,
      cohortName: enrollment.cohortName,
      accessType: enrollment.accessType,
      features: enrollment.features,
      enrolledAt: enrollment.enrolledAt,
    },
    course: {
      id: course._id,
      title: course.title,
      slug: course.slug,
      cohortName: course.cohortName,
    },
    metrics: {
      totalPublishedLessons,
      completedLessonsCount,
      progressPercentage,
      cohortRank,
    },
    continueLesson,
    lessons: enrichedLessons,
  };
};

/**
 * Get all published lessons for the student's enrolled course.
 */
const getCourseLessons = async (studentId, courseId) => {
  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
  });

  if (!enrollment) {
    throw new AppError('لا تمتلك اشتراكاً نشطاً في هذا الكورس', 403, ERROR_CODES.ENROLLMENT_REQUIRED);
  }

  const now = new Date();
  const publishedQuery = {
    courseId,
    isPublished: true,
    $or: [{ releaseDate: null }, { releaseDate: { $lte: now } }],
  };

  const [lessons, progressList] = await Promise.all([
    Lesson.find(publishedQuery).sort({ order: 1 }).select('title moduleTitle moduleNumber order duration isPublished releaseDate').lean(),
    LessonProgress.find({ studentId, courseId }).lean(),
  ]);

  const progressMap = {};
  progressList.forEach((p) => {
    progressMap[p.lessonId.toString()] = p;
  });

  return lessons.map((l) => ({
    ...l,
    isCompleted: !!progressMap[l._id.toString()]?.isCompleted,
    lastPositionSeconds: progressMap[l._id.toString()]?.lastPositionSeconds || 0,
  }));
};

/**
 * Get a single lesson for playback.
 * Enforces:
 * 1. Active enrollment check.
 * 2. Drip published check (`isPublished === true`).
 * 3. Never returns raw YouTube URL; returns an encrypted `videoToken`.
 *
 * @param {string} studentId
 * @param {string} lessonId
 * @param {string} sessionId
 */
const getSecureLesson = async (studentId, lessonId, sessionId) => {
  const lesson = await Lesson.findById(lessonId).populate('courseId');

  if (!lesson) {
    throw new AppError('المحاضرة غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }

  // 1. Enrollment check
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId: lesson.courseId._id,
    status: ENROLLMENT_STATUS.ACTIVE,
  });

  if (!enrollment) {
    throw new AppError('لا تمتلك اشتراكاً نشطاً في هذا الكورس', 403, ERROR_CODES.ENROLLMENT_REQUIRED);
  }

  // 2. Drip check
  if (!lesson.isPublished) {
    throw new AppError('هذه المحاضرة لم تُنشر بعد، ستتاح قريباً حسب جدول الدفعة', 403, ERROR_CODES.ENROLLMENT_FEATURE_DENIED);
  }

  if (lesson.releaseDate && new Date(lesson.releaseDate) > new Date()) {
    throw new AppError(
      `هذه المحاضرة مجدولة للنشر بتاريخ ${new Date(lesson.releaseDate).toLocaleDateString('ar-EG')}`,
      403,
      ERROR_CODES.ENROLLMENT_FEATURE_DENIED
    );
  }

  // Look up student progress for this lesson
  const progress = await LessonProgress.findOne({ studentId, lessonId }).lean();

  // 3. Generate secure video token (never exposes raw YouTube video ID in public payload)
  const videoToken = generateVideoToken(lesson.youtubeVideoId, studentId, sessionId);

  return {
    lesson: {
      id: lesson._id,
      title: lesson.title,
      moduleTitle: lesson.moduleTitle,
      moduleNumber: lesson.moduleNumber,
      order: lesson.order,
      duration: lesson.duration,
      description: lesson.description,
      resources: lesson.resources,
      courseId: lesson.courseId._id,
      courseTitle: lesson.courseId.title,
      cohortName: lesson.courseId.cohortName,
    },
    videoToken,
    progress: {
      isCompleted: !!progress?.isCompleted,
      lastPositionSeconds: progress?.lastPositionSeconds || 0,
      watchTimeSeconds: progress?.watchTimeSeconds || 0,
    },
  };
};

/**
 * Resolve video playback ID from encrypted token in-memory.
 */
const resolveVideoToken = async (studentId, token, sessionId) => {
  const videoId = decryptToken(token, studentId, sessionId);
  return { videoId };
};

/**
 * Update lesson watch progress and mark as completed.
 */
const updateLessonProgress = async (studentId, lessonId, { watchTimeSeconds, lastPositionSeconds, isCompleted }) => {
  const lesson = await Lesson.findById(lessonId);

  if (!lesson) {
    throw new AppError('المحاضرة غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }

  const courseId = lesson.courseId;

  // Build update object
  const updateData = {};
  if (watchTimeSeconds !== undefined) updateData.watchTimeSeconds = watchTimeSeconds;
  if (lastPositionSeconds !== undefined) updateData.lastPositionSeconds = lastPositionSeconds;
  if (isCompleted !== undefined) {
    updateData.isCompleted = isCompleted;
    updateData.completedAt = isCompleted ? new Date() : null;
  }

  const progress = await LessonProgress.findOneAndUpdate(
    { studentId, lessonId },
    {
      $set: {
        ...updateData,
        courseId,
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  // Recalculate course completion percentage
  const [totalPublished, completedCount] = await Promise.all([
    Lesson.countDocuments({ courseId, isPublished: true }),
    LessonProgress.countDocuments({ studentId, courseId, isCompleted: true }),
  ]);

  const progressPercentage =
    totalPublished > 0 ? Math.round((completedCount / totalPublished) * 100) : 0;

  return {
    progress,
    progressPercentage,
  };
};

module.exports = {
  getStudentDashboard,
  getCourseLessons,
  getSecureLesson,
  resolveVideoToken,
  updateLessonProgress,
};
