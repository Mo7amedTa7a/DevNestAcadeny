const mongoose = require('mongoose');
const { SUBMISSION_STATUS } = require('../../utils/constants');

const submissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    submissionUrl: {
      type: String,
      required: true,
      trim: true,
    },
    linkType: {
      type: String,
      enum: ['github', 'drive'],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.PENDING,
      index: true,
    },
    score: {
      type: Number,
      default: null,
      min: 0,
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One submission per student per task (students can resubmit/update before or after feedback)
submissionSchema.index({ taskId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ courseId: 1, status: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
