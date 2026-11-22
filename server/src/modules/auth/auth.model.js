const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../../utils/constants');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },
    studentCode: {
      type: String,
      unique: true,
      sparse: true, // Allows null for admin users
      uppercase: true,
      trim: true,
    },
    activeSessionId: {
      type: String,
      default: null,
      select: false, // Only loaded explicitly when needed
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.activeSessionId;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ----- Instance Methods -----

/**
 * Compare a plain-text password against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ----- Static Methods -----

/**
 * Hash a plain-text password.
 * @param {string} plainPassword
 * @returns {Promise<string>} Hashed password
 */
userSchema.statics.hashPassword = async function (plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
