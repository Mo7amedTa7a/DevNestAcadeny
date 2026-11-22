const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['github', 'drive', 'pdf', 'link'],
      default: 'link',
    },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    moduleTitle: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    moduleNumber: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    order: {
      type: Number,
      required: [true, 'Lesson order is required'],
    },
    youtubeVideoId: {
      type: String,
      required: [true, 'YouTube Video ID is required'],
      trim: true,
    },
    duration: {
      type: String,
      default: '1:30:00',
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    releaseDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    resources: [resourceSchema],
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

// Compound index for querying lessons in order
lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, isPublished: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;
