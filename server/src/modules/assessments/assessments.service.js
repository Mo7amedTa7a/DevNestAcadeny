const Assessment = require('./assessments.model');
const AssessmentAttempt = require('./assessmentAttempts.model');
const Enrollment = require('../enrollments/enrollments.model');
const { AppError } = require('../../utils/AppError');
const {
  ENROLLMENT_STATUS,
  ATTEMPT_STATUS,
  ERROR_CODES,
} = require('../../utils/constants');

/**
 * Fisher-Yates array shuffler
 */
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ==========================================
// ADMIN OPERATIONS
// ==========================================

const getAdminAssessments = async (courseId) => {
  const query = courseId ? { courseId } : {};
  const assessments = await Assessment.find(query)
    .populate('lessonId', 'title order')
    .sort({ createdAt: -1 })
    .lean();

  const assessmentIds = assessments.map((a) => a._id);
  const attempts = await AssessmentAttempt.aggregate([
    { $match: { assessmentId: { $in: assessmentIds } } },
    {
      $group: {
        _id: { assessmentId: '$assessmentId', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};
  attempts.forEach((item) => {
    const aId = item._id.assessmentId.toString();
    if (!statsMap[aId]) {
      statsMap[aId] = { total: 0, submitted: 0, auto_submitted_cheat: 0, in_progress: 0 };
    }
    statsMap[aId].total += item.count;
    statsMap[aId][item._id.status] = item.count;
  });

  return assessments.map((a) => ({
    ...a,
    totalQuestions: a.questions?.length || 0,
    attemptsSummary: statsMap[a._id.toString()] || {
      total: 0,
      submitted: 0,
      auto_submitted_cheat: 0,
      in_progress: 0,
    },
  }));
};

const createAssessment = async (data) => {
  return await Assessment.create(data);
};

const updateAssessment = async (id, data) => {
  const assessment = await Assessment.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!assessment) {
    throw new AppError('الاختبار غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }
  return assessment;
};

const deleteAssessment = async (id) => {
  const assessment = await Assessment.findByIdAndDelete(id);
  if (!assessment) {
    throw new AppError('الاختبار غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }
  await AssessmentAttempt.deleteMany({ assessmentId: id });
  return { message: 'تم حذف الاختبار وجميع سجلات المحاولات بنجاح' };
};

const getAssessmentAttempts = async (assessmentId) => {
  const assessment = await Assessment.findById(assessmentId).lean();
  if (!assessment) {
    throw new AppError('الاختبار غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }

  const attempts = await AssessmentAttempt.find({ assessmentId })
    .populate('studentId', 'fullName email studentCode')
    .sort({ createdAt: -1 })
    .lean();

  return {
    assessment,
    attempts,
  };
};

// ==========================================
// STUDENT OPERATIONS
// ==========================================

const getStudentAssessments = async (studentId, courseId) => {
  let targetCourseId = courseId;
  let enrollment;

  if (!targetCourseId) {
    enrollment = await Enrollment.findOne({
      studentId,
      status: ENROLLMENT_STATUS.ACTIVE,
    }).lean();

    if (!enrollment) {
      throw new AppError(
        'ليس لديك اشتراك نشط للوصول إلى الاختبارات',
        403,
        ERROR_CODES.ENROLLMENT_REQUIRED
      );
    }
    targetCourseId = enrollment.courseId;
  } else {
    enrollment = await Enrollment.findOne({
      studentId,
      courseId: targetCourseId,
      status: ENROLLMENT_STATUS.ACTIVE,
    }).lean();

    if (!enrollment) {
      throw new AppError(
        'ليس لديك اشتراك نشط في هذا الكورس للوصول إلى الاختبارات',
        403,
        ERROR_CODES.ENROLLMENT_REQUIRED
      );
    }
  }

  const canAccessExams = !!enrollment?.features?.canAccessExams;

  const assessments = await Assessment.find({
    courseId: targetCourseId,
    isPublished: true,
  })
    .sort({ type: -1, createdAt: 1 })
    .select('-questions.correctOptionIndex -questions.explanation')
    .lean();

  const assessmentIds = assessments.map((a) => a._id);
  const attempts = await AssessmentAttempt.find({
    assessmentId: { $in: assessmentIds },
    studentId,
  }).lean();

  const attemptsMap = {};
  attempts.forEach((att) => {
    attemptsMap[att.assessmentId.toString()] = att;
  });

  const enrichedAssessments = assessments.map((a) => {
    const attempt = attemptsMap[a._id.toString()] || null;
    return {
      _id: a._id,
      title: a.title,
      description: a.description,
      type: a.type,
      durationMinutes: a.durationMinutes,
      passingScore: a.passingScore,
      strictAntiCheat: a.strictAntiCheat,
      maxViolations: a.maxViolations,
      totalQuestions: a.questions?.length || 0,
      myAttempt: attempt
        ? {
            id: attempt._id,
            status: attempt.status,
            score: attempt.score,
            totalPoints: attempt.totalPoints,
            percentage: attempt.percentage,
            isPassed: attempt.isPassed,
            violationCount: attempt.violationCount,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            expiresAt: attempt.expiresAt,
          }
        : null,
    };
  });

  return {
    canAccessExams,
    cohortName: enrollment.cohortName,
    assessments: enrichedAssessments,
  };
};

/**
 * Start or resume an assessment attempt.
 * Server-side authority: NEVER sends correctOptionIndex to client!
 */
const startAssessmentAttempt = async (studentId, assessmentId) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment || !assessment.isPublished) {
    throw new AppError('الاختبار غير متوفر حالياً', 404, ERROR_CODES.NOT_FOUND);
  }

  // Tier gating check
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId: assessment.courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
  });

  if (!enrollment) {
    throw new AppError(
      'يجب أن تمتلك اشتراكاً فعالاً في الكورس لخوض الاختبار',
      403,
      ERROR_CODES.ENROLLMENT_REQUIRED
    );
  }

  if (!enrollment.features?.canAccessExams) {
    throw new AppError(
      'الاختبارات النظرية وشهادات التقييم متاحة فقط لطلاب الدفعة التفاعلية (Cohort)',
      403,
      ERROR_CODES.ENROLLMENT_FEATURE_DENIED
    );
  }

  let attempt = await AssessmentAttempt.findOne({
    assessmentId,
    studentId,
  });

  const now = new Date();

  // If already completed
  if (
    attempt &&
    (attempt.status === ATTEMPT_STATUS.SUBMITTED ||
      attempt.status === ATTEMPT_STATUS.AUTO_SUBMITTED_CHEAT)
  ) {
    return {
      alreadyCompleted: true,
      attempt: {
        id: attempt._id,
        status: attempt.status,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        submittedAt: attempt.submittedAt,
      },
    };
  }

  // If existing and in progress
  if (attempt && attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
    // Check if expired
    if (now > new Date(attempt.expiresAt.getTime() + 5000)) {
      // Auto-submit expired attempt
      await evaluateAttempt(attempt, assessment);
      return {
        alreadyCompleted: true,
        expired: true,
        attempt: {
          id: attempt._id,
          status: attempt.status,
          score: attempt.score,
          totalPoints: attempt.totalPoints,
          percentage: attempt.percentage,
          isPassed: attempt.isPassed,
          submittedAt: attempt.submittedAt,
        },
      };
    }
  }

  // Create new attempt if not existing
  if (!attempt) {
    const startedAt = new Date();
    // 5 seconds grace period for network latency
    const expiresAt = new Date(startedAt.getTime() + assessment.durationMinutes * 60000 + 5000);

    // Shuffle questions order for this student attempt
    const shuffledQuestions = shuffleArray(assessment.questions);
    const shuffledOrder = shuffledQuestions.map((q) => q._id);

    attempt = await AssessmentAttempt.create({
      assessmentId,
      studentId,
      courseId: assessment.courseId,
      startedAt,
      expiresAt,
      shuffledQuestionOrder: shuffledOrder,
      answers: [],
      violations: [],
      violationCount: 0,
      status: ATTEMPT_STATUS.IN_PROGRESS,
    });
  }

  // Prepare sanitized questions for student (strictly omit correctOptionIndex and explanation)
  const questionMap = {};
  assessment.questions.forEach((q) => {
    questionMap[q._id.toString()] = {
      _id: q._id,
      text: q.text,
      codeSnippet: q.codeSnippet || '',
      options: q.options,
      points: q.points,
    };
  });

  const orderedQuestions = attempt.shuffledQuestionOrder.map((qId) => questionMap[qId.toString()]);

  return {
    alreadyCompleted: false,
    attemptId: attempt._id,
    assessmentTitle: assessment.title,
    durationMinutes: assessment.durationMinutes,
    strictAntiCheat: assessment.strictAntiCheat,
    maxViolations: assessment.maxViolations,
    violationCount: attempt.violationCount,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    remainingSeconds: Math.max(0, Math.floor((new Date(attempt.expiresAt) - new Date()) / 1000)),
    questions: orderedQuestions,
    savedAnswers: attempt.answers || [],
  };
};

/**
 * Log Anti-Cheat Violation & trigger auto-submission on 3 strikes
 */
const logViolation = async (studentId, attemptId, { type, notes }) => {
  const attempt = await AssessmentAttempt.findOne({ _id: attemptId, studentId });
  if (!attempt) {
    throw new AppError('محاولة الاختبار غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }

  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    return {
      locked: true,
      reason: attempt.status,
      attempt,
    };
  }

  const assessment = await Assessment.findById(attempt.assessmentId);
  const maxViolations = assessment?.maxViolations || 3;

  attempt.violationCount += 1;
  attempt.violations.push({
    type,
    timestamp: new Date(),
    strikeNumber: attempt.violationCount,
    notes: notes || '',
  });

  let locked = false;
  if (attempt.violationCount >= maxViolations) {
    locked = true;
    attempt.status = ATTEMPT_STATUS.AUTO_SUBMITTED_CHEAT;
    attempt.submittedAt = new Date();
    // Auto-evaluate answers given so far
    await evaluateAttempt(attempt, assessment);
  } else {
    await attempt.save();
  }

  return {
    locked,
    violationCount: attempt.violationCount,
    maxViolations,
    status: attempt.status,
  };
};

/**
 * Grade and complete attempt
 */
const evaluateAttempt = async (attempt, assessment) => {
  const answersMap = {};
  attempt.answers.forEach((ans) => {
    answersMap[ans.questionId.toString()] = ans.selectedOptionIndex;
  });

  let totalPoints = 0;
  let earnedScore = 0;

  const evaluatedAnswers = assessment.questions.map((q) => {
    totalPoints += q.points;
    const selected = answersMap[q._id.toString()];
    const isCorrect = selected !== undefined && selected === q.correctOptionIndex;
    const pointsAwarded = isCorrect ? q.points : 0;
    earnedScore += pointsAwarded;

    return {
      questionId: q._id,
      selectedOptionIndex: selected ?? null,
      isCorrect,
      pointsAwarded,
    };
  });

  const percentage = totalPoints > 0 ? Math.round((earnedScore / totalPoints) * 100) : 0;
  const isPassed =
    attempt.status !== ATTEMPT_STATUS.AUTO_SUBMITTED_CHEAT &&
    percentage >= (assessment.passingScore || 70);

  attempt.answers = evaluatedAnswers;
  attempt.score = earnedScore;
  attempt.totalPoints = totalPoints;
  attempt.percentage = percentage;
  attempt.isPassed = isPassed;
  attempt.submittedAt = attempt.submittedAt || new Date();

  if (attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
    attempt.status = ATTEMPT_STATUS.SUBMITTED;
  }

  await attempt.save();
  return attempt;
};

/**
 * Submit student answers
 */
const submitAssessmentAttempt = async (studentId, attemptId, { answers }) => {
  const attempt = await AssessmentAttempt.findOne({ _id: attemptId, studentId });
  if (!attempt) {
    throw new AppError('محاولة الاختبار غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }

  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw new AppError('تم تسليم هذا الاختبار مسبقاً أو قفله', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const assessment = await Assessment.findById(attempt.assessmentId);
  if (!assessment) {
    throw new AppError('الاختبار غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }

  // Update answers
  attempt.answers = answers.map((a) => ({
    questionId: a.questionId,
    selectedOptionIndex: a.selectedOptionIndex,
  }));

  const evaluated = await evaluateAttempt(attempt, assessment);

  return {
    attemptId: evaluated._id,
    status: evaluated.status,
    score: evaluated.score,
    totalPoints: evaluated.totalPoints,
    percentage: evaluated.percentage,
    isPassed: evaluated.isPassed,
    violationCount: evaluated.violationCount,
    submittedAt: evaluated.submittedAt,
  };
};

/**
 * Review completed attempt with explanations
 */
const getAttemptReview = async (studentId, attemptId) => {
  const attempt = await AssessmentAttempt.findOne({ _id: attemptId, studentId }).lean();
  if (!attempt) {
    throw new AppError('سجل المحاولة غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }

  if (attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
    throw new AppError('لا يمكن استعراض الإجابات الصحيحة أثناء سير الاختبار', 403, ERROR_CODES.AUTH_FORBIDDEN);
  }

  const assessment = await Assessment.findById(attempt.assessmentId).lean();
  const answersMap = {};
  attempt.answers.forEach((a) => {
    answersMap[a.questionId.toString()] = a;
  });

  const reviewQuestions = assessment.questions.map((q) => {
    const studentAns = answersMap[q._id.toString()];
    return {
      _id: q._id,
      text: q.text,
      codeSnippet: q.codeSnippet,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || '',
      studentSelectedOptionIndex: studentAns?.selectedOptionIndex ?? null,
      isCorrect: studentAns?.isCorrect ?? false,
      points: q.points,
    };
  });

  return {
    assessmentTitle: assessment.title,
    status: attempt.status,
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    percentage: attempt.percentage,
    isPassed: attempt.isPassed,
    violationCount: attempt.violationCount,
    violations: attempt.violations || [],
    submittedAt: attempt.submittedAt,
    questions: reviewQuestions,
  };
};

module.exports = {
  getAdminAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentAttempts,
  getStudentAssessments,
  startAssessmentAttempt,
  logViolation,
  submitAssessmentAttempt,
  getAttemptReview,
};
