const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    moduleNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    moduleTitle: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    deadline: {
      type: Date,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
      max: 1000,
    },
    allowedLinkTypes: {
      type: [String],
      enum: ['github', 'drive'],
      default: ['github', 'drive'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ courseId: 1, moduleNumber: 1, deadline: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
