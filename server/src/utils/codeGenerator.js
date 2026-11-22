const User = require('../modules/auth/auth.model');

/**
 * Generates an atomic, unique student code following the academy standard:
 * DN-<COURSE_CODE>-<YEAR>-<SEQUENCE>
 * e.g., DN-FE-26-001
 *
 * @param {string} courseCode - e.g. 'FE' for Front-End
 * @returns {Promise<string>}
 */
const generateStudentCode = async (courseCode = 'FE') => {
  const currentYear = new Date().getFullYear().toString().slice(-2); // e.g. '26'
  const prefix = `DN-${courseCode.toUpperCase()}-${currentYear}-`;

  // Find the highest sequence number for this prefix
  const highestStudent = await User.findOne({
    studentCode: new RegExp(`^${prefix}\\d+$`),
  })
    .sort({ studentCode: -1 })
    .select('studentCode')
    .lean();

  let nextSequence = 1;

  if (highestStudent && highestStudent.studentCode) {
    const parts = highestStudent.studentCode.split('-');
    const currentSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  // Format with 3-digit zero-padding: 001, 002, ...
  const paddedSeq = nextSequence.toString().padStart(3, '0');
  return `${prefix}${paddedSeq}`;
};

/**
 * Generate a random temporary password for student accounts.
 * Format: DevNest@<4 digits> (e.g., DevNest@8492)
 *
 * @returns {string}
 */
const generateTempPassword = () => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `DevNest@${randomDigits}`;
};

module.exports = {
  generateStudentCode,
  generateTempPassword,
};
