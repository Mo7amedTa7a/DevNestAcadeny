const mongoose = require('mongoose');
const { PAYMENT_STATUS, REGISTRATION_STATUS } = require('../../utils/constants');

const registrationSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    age: {
      type: Number,
      min: [14, 'Minimum age is 14'],
      max: [70, 'Maximum age is 70'],
      default: null,
    },
    background: {
      type: String,
      trim: true,
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'some_basics', 'intermediate'],
      default: 'beginner',
    },
    goals: {
      type: String,
      trim: true,
      default: '',
    },
    preferredPaymentMethod: {
      type: String,
      trim: true,
      default: 'vodafone_cash',
    },
    referralSource: {
      type: String,
      trim: true,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.PENDING,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: null,
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

// Compound index to check existing registrations for the same course
registrationSchema.index({ courseId: 1, email: 1 });
registrationSchema.index({ courseId: 1, phone: 1 });

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
