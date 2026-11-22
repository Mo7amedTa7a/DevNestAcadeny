const Enrollment = require('../enrollments/enrollments.model');
const Submission = require('../tasks/submissions.model');
const User = require('../auth/auth.model');
const Course = require('../courses/courses.model');
const { AppError } = require('../../utils/AppError');
const {
  ENROLLMENT_STATUS,
  SUBMISSION_STATUS,
  ERROR_CODES,
} = require('../../utils/constants');

/**
 * Get live cohort leaderboard
 *
 * @param {string} studentId - Requesting user ID
 * @param {string} courseId - Optional course ID (defaults to active enrollment)
 */
const getCohortLeaderboard = async (studentId, courseId) => {
  let targetCourseId = courseId;
  let userEnrollment;

  if (!targetCourseId) {
    userEnrollment = await Enrollment.findOne({
      studentId,
      status: ENROLLMENT_STATUS.ACTIVE,
    }).populate('courseId', 'title slug cohortName');

    if (!userEnrollment) {
      throw new AppError(
        'ليس لديك اشتراك نشط في أي كورس لعرض لوحة المتصدرين',
        403,
        ERROR_CODES.ENROLLMENT_REQUIRED
      );
    }
    targetCourseId = userEnrollment.courseId._id;
  } else {
    userEnrollment = await Enrollment.findOne({
      studentId,
      courseId: targetCourseId,
      status: ENROLLMENT_STATUS.ACTIVE,
    }).populate('courseId', 'title slug cohortName');

    if (!userEnrollment) {
      throw new AppError(
        'ليس لديك اشتراك نشط في هذا الكورس لعرض لوحة المتصدرين',
        403,
        ERROR_CODES.ENROLLMENT_REQUIRED
      );
    }
  }

  // Feature gate check: recorded_only students are excluded
  if (!userEnrollment.features?.showInLeaderboard) {
    throw new AppError(
      'لوحة المتصدرين ومنافسات الدفعة متاحة حصرياً لطلاب الدفعة التفاعلية (Cohort)',
      403,
      ERROR_CODES.ENROLLMENT_FEATURE_DENIED
    );
  }

  // Find all active enrollments for this course that have showInLeaderboard: true
  const eligibleEnrollments = await Enrollment.find({
    courseId: targetCourseId,
    status: ENROLLMENT_STATUS.ACTIVE,
    'features.showInLeaderboard': true,
  })
    .populate('studentId', 'fullName studentCode email isActive')
    .lean();

  const eligibleStudentIds = eligibleEnrollments
    .filter((e) => e.studentId && e.studentId.isActive)
    .map((e) => e.studentId._id);

  // Aggregate reviewed submission scores
  const scoreAggregates = await Submission.aggregate([
    {
      $match: {
        courseId: targetCourseId,
        studentId: { $in: eligibleStudentIds },
        status: SUBMISSION_STATUS.REVIEWED,
      },
    },
    {
      $group: {
        _id: '$studentId',
        totalPoints: { $sum: '$score' },
        tasksCompleted: { $sum: 1 },
        lastSubmissionAt: { $max: '$submittedAt' },
      },
    },
  ]);

  const scoreMap = {};
  scoreAggregates.forEach((item) => {
    scoreMap[item._id.toString()] = {
      totalPoints: item.totalPoints || 0,
      tasksCompleted: item.tasksCompleted || 0,
      lastSubmissionAt: item.lastSubmissionAt || new Date(0),
    };
  });

  // Build ranking entries for all eligible students
  const studentList = eligibleEnrollments
    .filter((e) => e.studentId && e.studentId.isActive)
    .map((e) => {
      const u = e.studentId;
      const scores = scoreMap[u._id.toString()] || {
        totalPoints: 0,
        tasksCompleted: 0,
        lastSubmissionAt: new Date(0),
      };

      return {
        studentId: u._id,
        fullName: u.fullName,
        studentCode: u.studentCode || 'DN-STUDENT',
        totalPoints: scores.totalPoints,
        tasksCompleted: scores.tasksCompleted,
        lastSubmissionAt: scores.lastSubmissionAt,
      };
    });

  // Sort: 1) totalPoints DESC, 2) tasksCompleted DESC, 3) lastSubmissionAt ASC
  studentList.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.tasksCompleted !== a.tasksCompleted) {
      return b.tasksCompleted - a.tasksCompleted;
    }
    return new Date(a.lastSubmissionAt) - new Date(b.lastSubmissionAt);
  });

  // Assign ranks
  let myRankEntry = null;
  const rankedCohort = studentList.map((entry, index) => {
    const rank = index + 1;
    const rankedEntry = {
      rank,
      studentId: entry.studentId,
      fullName: entry.fullName,
      studentCode: entry.studentCode,
      totalPoints: entry.totalPoints,
      tasksCompleted: entry.tasksCompleted,
      isCurrentUser: entry.studentId.toString() === studentId.toString(),
    };

    if (rankedEntry.isCurrentUser) {
      myRankEntry = rankedEntry;
    }
    return rankedEntry;
  });

  const topThree = rankedCohort.slice(0, 3);

  return {
    course: {
      id: userEnrollment.courseId._id,
      title: userEnrollment.courseId.title,
      cohortName: userEnrollment.cohortName,
    },
    totalParticipants: rankedCohort.length,
    topThree,
    myRank: myRankEntry,
    cohortList: rankedCohort,
  };
};

module.exports = {
  getCohortLeaderboard,
};
