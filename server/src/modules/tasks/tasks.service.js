const Task = require('./tasks.model');
const Submission = require('./submissions.model');
const Enrollment = require('../enrollments/enrollments.model');
const User = require('../auth/auth.model');
const { AppError } = require('../../utils/AppError');
const {
  ENROLLMENT_STATUS,
  SUBMISSION_STATUS,
  ERROR_CODES,
} = require('../../utils/constants');
const { GITHUB_REPO_REGEX, GOOGLE_DRIVE_REGEX } = require('./tasks.validation');

/**
 * Determine link type based on URL
 */
const detectLinkType = (url) => {
  if (GITHUB_REPO_REGEX.test(url)) return 'github';
  if (GOOGLE_DRIVE_REGEX.test(url)) return 'drive';
  throw new AppError(
    'نوع الرابط غير مدعوم. يرجى تقديم رابط GitHub أو Google Drive صالح',
    400,
    ERROR_CODES.VALIDATION_ERROR
  );
};

// ==========================================
// ADMIN OPERATIONS
// ==========================================

/**
 * Get all tasks for an admin with submission summary counts
 */
const getAdminTasks = async (courseId) => {
  const query = courseId ? { courseId } : {};
  const tasks = await Task.find(query).sort({ moduleNumber: 1, deadline: 1 }).lean();

  // Aggregate submission counts per task
  const taskIds = tasks.map((t) => t._id);
  const submissions = await Submission.aggregate([
    { $match: { taskId: { $in: taskIds } } },
    {
      $group: {
        _id: { taskId: '$taskId', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};
  submissions.forEach((item) => {
    const tId = item._id.taskId.toString();
    if (!statsMap[tId]) {
      statsMap[tId] = { total: 0, pending: 0, reviewed: 0, needs_revision: 0 };
    }
    statsMap[tId].total += item.count;
    statsMap[tId][item._id.status] = item.count;
  });

  return tasks.map((task) => ({
    ...task,
    submissionsSummary: statsMap[task._id.toString()] || {
      total: 0,
      pending: 0,
      reviewed: 0,
      needs_revision: 0,
    },
  }));
};

/**
 * Create a new task (Admin)
 */
const createTask = async (data) => {
  return await Task.create({
    ...data,
    deadline: new Date(data.deadline),
  });
};

/**
 * Update an existing task (Admin)
 */
const updateTask = async (taskId, data) => {
  if (data.deadline) {
    data.deadline = new Date(data.deadline);
  }
  const task = await Task.findByIdAndUpdate(taskId, data, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!task) {
    throw new AppError('المهمة غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }
  return task;
};

/**
 * Delete a task (Admin)
 */
const deleteTask = async (taskId) => {
  const task = await Task.findByIdAndDelete(taskId);
  if (!task) {
    throw new AppError('المهمة غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }
  // Remove associated submissions
  await Submission.deleteMany({ taskId });
  return { message: 'تم حذف المهمة وجميع تسليماتها بنجاح' };
};

/**
 * Get all submissions for a task (Admin)
 */
const getTaskSubmissions = async (taskId) => {
  const task = await Task.findById(taskId).lean();
  if (!task) {
    throw new AppError('المهمة غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }

  const submissions = await Submission.find({ taskId })
    .populate('studentId', 'fullName email studentCode')
    .populate('reviewedBy', 'fullName')
    .sort({ submittedAt: -1 })
    .lean();

  return {
    task,
    submissions,
  };
};

/**
 * Grade a student submission (Admin Code Reviewer)
 */
const gradeSubmission = async (submissionId, { score, feedback, status }, adminId) => {
  const submission = await Submission.findById(submissionId).populate('taskId');
  if (!submission) {
    throw new AppError('تسليم المهمة غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }

  const task = submission.taskId;
  if (score > task.maxScore) {
    throw new AppError(
      `الدرجة (${score}) لا يمكن أن تتجاوز الحد الأقصى للمهمة (${task.maxScore})`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  submission.score = score;
  submission.feedback = feedback;
  submission.status = status;
  submission.reviewedAt = new Date();
  submission.reviewedBy = adminId;

  await submission.save();

  return await Submission.findById(submissionId)
    .populate('studentId', 'fullName email studentCode')
    .populate('reviewedBy', 'fullName')
    .lean();
};

// ==========================================
// STUDENT OPERATIONS
// ==========================================

/**
 * Get all tasks for student's active enrollment with their submission status
 */
const getStudentTasks = async (studentId, courseId) => {
  // If courseId not passed, find student's active enrollment
  let targetCourseId = courseId;
  let enrollment;

  if (!targetCourseId) {
    enrollment = await Enrollment.findOne({
      studentId,
      status: ENROLLMENT_STATUS.ACTIVE,
    }).lean();

    if (!enrollment) {
      throw new AppError(
        'ليس لديك اشتراك نشط في أي كورس للوصول إلى المهام',
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
        'ليس لديك اشتراك نشط في هذا الكورس للوصول إلى المهام',
        403,
        ERROR_CODES.ENROLLMENT_REQUIRED
      );
    }
  }

  // Check feature permission
  const canAccessTasks = !!enrollment?.features?.canAccessTasks;

  const tasks = await Task.find({ courseId: targetCourseId, isActive: true })
    .sort({ moduleNumber: 1, deadline: 1 })
    .lean();

  const taskIds = tasks.map((t) => t._id);
  const submissions = await Submission.find({
    taskId: { $in: taskIds },
    studentId,
  })
    .populate('reviewedBy', 'fullName')
    .lean();

  const submissionMap = {};
  submissions.forEach((sub) => {
    submissionMap[sub.taskId.toString()] = sub;
  });

  const now = new Date();

  const enrichedTasks = tasks.map((task) => {
    const sub = submissionMap[task._id.toString()] || null;
    const isPastDeadline = new Date(task.deadline) < now;

    return {
      ...task,
      isPastDeadline,
      submission: sub
        ? {
            id: sub._id,
            submissionUrl: sub.submissionUrl,
            linkType: sub.linkType,
            notes: sub.notes,
            status: sub.status,
            score: sub.score,
            feedback: sub.feedback,
            submittedAt: sub.submittedAt,
            reviewedAt: sub.reviewedAt,
            reviewedBy: sub.reviewedBy ? sub.reviewedBy.fullName : null,
          }
        : null,
    };
  });

  return {
    canAccessTasks,
    cohortName: enrollment.cohortName,
    tasks: enrichedTasks,
  };
};

/**
 * Submit task solution by student
 */
const submitTask = async (studentId, taskId, { submissionUrl, notes }) => {
  const task = await Task.findById(taskId);
  if (!task || !task.isActive) {
    throw new AppError('المهمة غير متوفرة أو معطلة', 404, ERROR_CODES.NOT_FOUND);
  }

  // Check enrollment & tier gating
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId: task.courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
  });

  if (!enrollment) {
    throw new AppError(
      'عذراً، يجب أن تمتلك اشتراكاً فعالاً في الكورس لتقديم المهام',
      403,
      ERROR_CODES.ENROLLMENT_REQUIRED
    );
  }

  if (!enrollment.features?.canAccessTasks) {
    throw new AppError(
      'تسليم المهام ومراجعة الكود متاحة فقط لطلاب الدفعة التفاعلية (Cohort) وغير مشمولة في باقة التسجيلات فقط',
      403,
      ERROR_CODES.ENROLLMENT_FEATURE_DENIED
    );
  }

  const linkType = detectLinkType(submissionUrl);

  // Check if allowed
  if (task.allowedLinkTypes && !task.allowedLinkTypes.includes(linkType)) {
    throw new AppError(
      `نوع الرابط (${linkType}) غير مسموح به في هذه المهمة`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Upsert submission
  const submission = await Submission.findOneAndUpdate(
    { taskId: task._id, studentId },
    {
      courseId: task.courseId,
      submissionUrl,
      linkType,
      notes: notes || '',
      status: SUBMISSION_STATUS.PENDING,
      submittedAt: new Date(),
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );

  return submission;
};

module.exports = {
  getAdminTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions,
  gradeSubmission,
  getStudentTasks,
  submitTask,
  detectLinkType,
};
