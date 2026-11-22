const Registration = require('../registrations/registrations.model');
const Course = require('../courses/courses.model');
const Lesson = require('../lessons/lessons.model');
const Enrollment = require('../enrollments/enrollments.model');
const User = require('../auth/auth.model');
const { AppError } = require('../../utils/AppError');
const { generateStudentCode, generateTempPassword } = require('../../utils/codeGenerator');
const {
  ROLES,
  ACCESS_TYPES,
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  ENROLLMENT_STATUS,
  ERROR_CODES,
} = require('../../utils/constants');

/**
 * Get overview KPI statistics for admin dashboard.
 */
const getOverviewStats = async () => {
  const [
    totalApplicants,
    paidApplicants,
    pendingApplicants,
    totalStudents,
    totalCourses,
    publishedLessons,
  ] = await Promise.all([
    Registration.countDocuments(),
    Registration.countDocuments({ paymentStatus: PAYMENT_STATUS.PAID }),
    Registration.countDocuments({ status: REGISTRATION_STATUS.PENDING }),
    User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
    Course.countDocuments({ isActive: true }),
    Lesson.countDocuments({ isPublished: true }),
  ]);

  const conversionRate =
    totalApplicants > 0 ? Math.round((paidApplicants / totalApplicants) * 100) : 0;

  // Recent 5 applicants
  const recentApplicants = await Registration.find()
    .populate('courseId', 'title cohortName price')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    kpis: {
      totalApplicants,
      paidApplicants,
      pendingApplicants,
      totalStudents,
      totalCourses,
      publishedLessons,
      conversionRate,
    },
    recentApplicants,
  };
};

/**
 * Get paginated applicants with search and filter.
 */
const getApplicants = async ({ status, paymentStatus, search, page = 1, limit = 20 }) => {
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (paymentStatus && paymentStatus !== 'all') {
    query.paymentStatus = paymentStatus;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { fullName: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [applicants, total] = await Promise.all([
    Registration.find(query)
      .populate('courseId', 'title cohortName price currency offerPrice hasOffer slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Registration.countDocuments(query),
  ]);

  return {
    applicants,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Update registration status and admin notes.
 */
const updateApplicantStatus = async (id, { status, adminNotes }) => {
  const applicant = await Registration.findById(id);
  if (!applicant) {
    throw new AppError('طلب التسجيل غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }

  if (status) applicant.status = status;
  if (adminNotes !== undefined) applicant.adminNotes = adminNotes;

  await applicant.save();
  return applicant;
};

/**
 * Approve payment, mark status approved, generate student code, and create User + Enrollment.
 * This is the CORE payment-gated activation workflow.
 */
const approvePaymentAndActivateStudent = async (registrationId, { accessType = ACCESS_TYPES.COHORT, initialPassword, adminNotes }) => {
  const registration = await Registration.findById(registrationId).populate('courseId');

  if (!registration) {
    throw new AppError('طلب التسجيل غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }

  const course = registration.courseId;
  if (!course) {
    throw new AppError('الكورس المرتبط بهذا الطلب غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }

  // Check if a user with this email already exists
  let user = await User.findOne({ email: registration.email });
  let studentCode = user?.studentCode;
  let tempPassword = initialPassword || generateTempPassword();

  if (!user) {
    // Generate next unique student code (e.g. DN-FE-26-002)
    studentCode = await generateStudentCode('FE');
    const passwordHash = await User.hashPassword(tempPassword);

    user = await User.create({
      fullName: registration.fullName,
      email: registration.email,
      phone: registration.phone,
      passwordHash,
      role: ROLES.STUDENT,
      studentCode,
      isActive: true,
    });
  } else if (!user.studentCode) {
    // Existing user (e.g. registered before) gets code
    studentCode = await generateStudentCode('FE');
    user.studentCode = studentCode;
    user.role = ROLES.STUDENT;
    await user.save();
  }

  // Feature flags based on accessType (cohort vs recorded_only)
  const isCohort = accessType === ACCESS_TYPES.COHORT;
  const features = {
    canAccessTasks: isCohort,
    canAccessExams: isCohort,
    showInLeaderboard: isCohort,
  };

  // Create or update active Enrollment
  let enrollment = await Enrollment.findOne({
    studentId: user._id,
    courseId: course._id,
  });

  if (!enrollment) {
    enrollment = await Enrollment.create({
      studentId: user._id,
      courseId: course._id,
      cohortName: course.cohortName || 'الدفعة الأولى',
      accessType,
      features,
      status: ENROLLMENT_STATUS.ACTIVE,
    });
  } else {
    enrollment.accessType = accessType;
    enrollment.features = features;
    enrollment.status = ENROLLMENT_STATUS.ACTIVE;
    await enrollment.save();
  }

  // Update registration record
  registration.paymentStatus = PAYMENT_STATUS.PAID;
  registration.status = REGISTRATION_STATUS.APPROVED;
  if (adminNotes) registration.adminNotes = adminNotes;
  await registration.save();

  return {
    student: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      studentCode: user.studentCode,
      tempPassword,
    },
    enrollment: {
      id: enrollment._id,
      cohortName: enrollment.cohortName,
      accessType: enrollment.accessType,
      features: enrollment.features,
    },
    courseTitle: course.title,
  };
};

/**
 * Generate CSV data for all or filtered applicants.
 * Includes UTF-8 BOM so Arabic displays correctly in Excel.
 */
const exportApplicantsCsv = async (filters = {}) => {
  const query = {};
  if (filters.status && filters.status !== 'all') query.status = filters.status;
  if (filters.paymentStatus && filters.paymentStatus !== 'all') query.paymentStatus = filters.paymentStatus;

  const applicants = await Registration.find(query)
    .populate('courseId', 'title cohortName price')
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    'الاسم الكامل',
    'البريد الإلكتروني',
    'رقم الهاتف',
    'الكورس',
    'الدفعة',
    'مستوى الخبرة',
    'حالة الدفع',
    'حالة الطلب',
    'تاريخ التقديم',
  ];

  const rows = applicants.map((a) => [
    `"${(a.fullName || '').replace(/"/g, '""')}"`,
    `"${a.email || ''}"`,
    `"${a.phone || ''}"`,
    `"${(a.courseId?.title || '').replace(/"/g, '""')}"`,
    `"${a.courseId?.cohortName || ''}"`,
    `"${a.experienceLevel || ''}"`,
    `"${a.paymentStatus === PAYMENT_STATUS.PAID ? 'تم الدفع' : 'غير مدفوع'}"`,
    `"${a.status}"`,
    `"${new Date(a.createdAt).toLocaleDateString('ar-EG')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return csvContent;
};

// ----- Lessons Management -----

const getLessonsForCourse = async (courseId) => {
  return Lesson.find({ courseId }).sort({ order: 1, createdAt: 1 }).lean();
};

const createLesson = async (data) => {
  return Lesson.create(data);
};

const updateLesson = async (id, data) => {
  const lesson = await Lesson.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
  if (!lesson) {
    throw new AppError('المحاضرة غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }
  return lesson;
};

const togglePublishLesson = async (id) => {
  const lesson = await Lesson.findById(id);
  if (!lesson) {
    throw new AppError('المحاضرة غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }
  lesson.isPublished = !lesson.isPublished;
  await lesson.save();
  return lesson;
};

const deleteLesson = async (id) => {
  const lesson = await Lesson.findByIdAndDelete(id);
  if (!lesson) {
    throw new AppError('المحاضرة غير موجودة', 404, ERROR_CODES.NOT_FOUND);
  }
  return { message: 'تم حذف المحاضرة بنجاح' };
};

// ----- Course Registration Toggle -----

const toggleCourseRegistration = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('الكورس غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }
  course.isRegistrationOpen = !course.isRegistrationOpen;
  await course.save();
  return course;
};

// ----- Students & Sessions Management -----

const getStudents = async () => {
  const students = await User.find({ role: ROLES.STUDENT })
    .select('+activeSessionId')
    .sort({ createdAt: -1 })
    .lean();

  const studentIds = students.map((s) => s._id);

  // Fetch enrollments
  const enrollments = await Enrollment.find({ studentId: { $in: studentIds } })
    .populate('courseId', 'title cohortName')
    .lean();

  const enrollmentMap = {};
  enrollments.forEach((e) => {
    enrollmentMap[e.studentId.toString()] = e;
  });

  return students.map((s) => ({
    ...s,
    hasActiveSession: !!s.activeSessionId,
    enrollment: enrollmentMap[s._id.toString()] || null,
  }));
};

const resetStudentSession = async (studentId) => {
  const student = await User.findByIdAndUpdate(
    studentId,
    { activeSessionId: null },
    { returnDocument: 'after' }
  );
  if (!student) {
    throw new AppError('الطالب غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }
  return { message: 'تمت إعادة ضبط الجلسة بنجاح، يستطيع الطالب تسجيل الدخول مجدداً' };
};

const toggleStudentActive = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student) {
    throw new AppError('الطالب غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }
  student.isActive = !student.isActive;
  if (!student.isActive) {
    student.activeSessionId = null; // Invalidate current session if suspended
  }
  await student.save();
  return student;
};

// ----- Hero Announcement Management -----
const Announcement = require('./announcement.model');

const getAnnouncementSettings = async () => {
  let doc = await Announcement.findOne({ key: 'hero_announcement' });
  if (!doc) {
    doc = await Announcement.create({ key: 'hero_announcement' });
  }
  return doc;
};

const updateAnnouncementSettings = async (data) => {
  let doc = await Announcement.findOne({ key: 'hero_announcement' });
  if (!doc) {
    doc = await Announcement.create({ key: 'hero_announcement', ...data });
  } else {
    if (typeof data.isEnabled === 'boolean') doc.isEnabled = data.isEnabled;
    if (data.mode) doc.mode = data.mode;
    if (data.selectedCourseSlug) doc.selectedCourseSlug = data.selectedCourseSlug;
    if (data.templates) doc.templates = data.templates;
    if (data.custom) doc.custom = data.custom;
    await doc.save();
  }
  return doc;
};

const getPublicAnnouncement = async () => {
  let doc = await Announcement.findOne({ key: 'hero_announcement' }).lean();
  if (!doc) {
    const created = await Announcement.create({ key: 'hero_announcement' });
    doc = created.toObject();
  }

  if (!doc.isEnabled) {
    return { isEnabled: false };
  }

  if (doc.mode === 'custom') {
    return {
      isEnabled: true,
      mode: 'custom',
      badge: doc.custom?.badge || 'إعلان خاص',
      title: doc.custom?.title || '',
      details: doc.custom?.details || '',
      buttonText: doc.custom?.buttonText || 'سجّل الآن 🚀',
      buttonLink: doc.custom?.buttonLink || '#tracks',
    };
  }

  // Course mode
  const courseSlug = doc.selectedCourseSlug || 'frontend-development';
  const course = await Course.findOne({ slug: courseSlug, isActive: true }).lean();
  const template = doc.templates?.[courseSlug] || {
    badge: 'إعلان مسار تدريبي',
    title: course?.title || 'معسكر تدريبي جديد',
    details: course?.shortDescription || '',
    buttonText: 'سجّل مقعدك الآن 🚀',
  };

  return {
    isEnabled: true,
    mode: 'course',
    courseSlug,
    courseTitle: course?.title,
    isCourseOpen: course?.isRegistrationOpen ?? false,
    badge: template.badge,
    title: template.title,
    details: template.details,
    buttonText: template.buttonText,
    buttonLink: '#tracks',
  };
};

// ----- Course Content & Curriculum Management -----
const getAllCoursesAdmin = async () => {
  return Course.find({ isActive: true }).sort({ createdAt: 1 }).lean();
};

const updateCourse = async (courseId, data) => {
  const course = await Course.findByIdAndUpdate(courseId, data, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!course) {
    throw new AppError('الكورس غير موجود', 404, ERROR_CODES.NOT_FOUND);
  }
  return course;
};

module.exports = {
  getOverviewStats,
  getApplicants,
  updateApplicantStatus,
  approvePaymentAndActivateStudent,
  exportApplicantsCsv,
  getLessonsForCourse,
  createLesson,
  updateLesson,
  togglePublishLesson,
  deleteLesson,
  toggleCourseRegistration,
  getStudents,
  resetStudentSession,
  toggleStudentActive,
  getAnnouncementSettings,
  updateAnnouncementSettings,
  getPublicAnnouncement,
  getAllCoursesAdmin,
  updateCourse,
};
