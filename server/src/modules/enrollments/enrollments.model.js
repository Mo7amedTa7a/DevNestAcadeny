const mongoose = require('mongoose');
const { ACCESS_TYPES, ENROLLMENT_STATUS } = require('../../utils/constants');

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    cohortName: {
      type: String,
      required: [true, 'Cohort name is required'],
      trim: true,
    },
    accessType: {
      type: String,
      enum: Object.values(ACCESS_TYPES),
      default: ACCESS_TYPES.COHORT,
    },
    features: {
      canAccessTasks: {
        type: Boolean,
        default: true,
      },
      canAccessExams: {
        type: Boolean,
        default: true,
      },
      showInLeaderboard: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.ACTIVE,
      index: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Ensure a student has only one enrollment record per course
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
