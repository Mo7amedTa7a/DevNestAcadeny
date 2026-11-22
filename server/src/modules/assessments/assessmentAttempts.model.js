const mongoose = require('mongoose');
const { ATTEMPT_STATUS } = require('../../utils/constants');

const violationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['blur', 'fullscreen_exit', 'tab_switch', 'devtools_open', 'contextmenu_attempt'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    strikeNumber: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const studentAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
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
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    shuffledQuestionOrder: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    answers: {
      type: [studentAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    violations: {
      type: [violationSchema],
      default: [],
    },
    violationCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(ATTEMPT_STATUS),
      default: ATTEMPT_STATUS.IN_PROGRESS,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index({ assessmentId: 1, studentId: 1 });
assessmentAttemptSchema.index({ studentId: 1, status: 1 });

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

module.exports = AssessmentAttempt;
