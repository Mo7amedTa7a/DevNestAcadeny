/** User roles */
const ROLES = Object.freeze({
  ADMIN: 'admin',
  STUDENT: 'student',
});

/** Enrollment access types */
const ACCESS_TYPES = Object.freeze({
  COHORT: 'cohort',
  RECORDED_ONLY: 'recorded_only',
});

/** Registration payment statuses */
const PAYMENT_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid',
});

/** Registration statuses */
const REGISTRATION_STATUS = Object.freeze({
  PENDING: 'pending',
  CONTACTED: 'contacted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

/** Enrollment statuses */
const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  COMPLETED: 'completed',
});

/** Submission statuses */
const SUBMISSION_STATUS = Object.freeze({
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  NEEDS_REVISION: 'needs_revision',
});

/** Assessment types */
const ASSESSMENT_TYPE = Object.freeze({
  QUIZ: 'quiz',
  EXAM: 'exam',
});

/** Attempt statuses */
const ATTEMPT_STATUS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  AUTO_SUBMITTED_CHEAT: 'auto_submitted_cheat',
});

/** Rate limit configurations */
const RATE_LIMITS = Object.freeze({
  GLOBAL: { windowMs: 15 * 60 * 1000, max: 200 },
  AUTH_LOGIN: { windowMs: 10 * 60 * 1000, max: 50 },
  REGISTRATION: { windowMs: 15 * 60 * 1000, max: 30 },
  ASSESSMENT: { windowMs: 15 * 60 * 1000, max: 60 },
});

/** Error codes */
const ERROR_CODES = Object.freeze({
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_SESSION_REVOKED: 'AUTH_SESSION_REVOKED',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  // Enrollment
  ENROLLMENT_REQUIRED: 'ENROLLMENT_REQUIRED',
  ENROLLMENT_FEATURE_DENIED: 'ENROLLMENT_FEATURE_DENIED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Generic
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

module.exports = {
  ROLES,
  ACCESS_TYPES,
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  ENROLLMENT_STATUS,
  SUBMISSION_STATUS,
  ASSESSMENT_TYPE,
  ATTEMPT_STATUS,
  RATE_LIMITS,
  ERROR_CODES,
};
