const mongoose = require('mongoose');
const { ASSESSMENT_TYPE } = require('../../utils/constants');

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    codeSnippet: {
      type: String,
      trim: true,
      default: '',
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (val) => val && val.length >= 2,
        message: 'يجب توفير خيارين على الأقل لكل سؤال',
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    points: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const assessmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ASSESSMENT_TYPE),
      default: ASSESSMENT_TYPE.EXAM,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 1,
      max: 180,
    },
    passingScore: {
      type: Number,
      required: true,
      default: 70, // Percentage
      min: 0,
      max: 100,
    },
    strictAntiCheat: {
      type: Boolean,
      default: true,
    },
    maxViolations: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (val) => val && val.length > 0,
        message: 'يجب إضافة سؤال واحد على الأقل للاختبار',
      },
    },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ courseId: 1, isPublished: 1, type: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
