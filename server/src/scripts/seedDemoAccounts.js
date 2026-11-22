const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../modules/auth/auth.model');
const Course = require('../modules/courses/courses.model');
const Lesson = require('../modules/lessons/lessons.model');
const Enrollment = require('../modules/enrollments/enrollments.model');
const Task = require('../modules/tasks/tasks.model');
const Assessment = require('../modules/assessments/assessments.model');

async function seedDemoAccounts() {
  await connectDB();

  console.log('Seeding demo accounts and content...');

  const course = await Course.findOne({ slug: 'frontend-development' });
  if (!course) {
    console.error('Course not found');
    process.exit(1);
  }

  // 1. Ensure Admin
  const adminHash = await User.hashPassword('Admin@123');
  await User.findOneAndUpdate(
    { email: 'admin@devnest.academy' },
    {
      fullName: 'م. محمد (مدير DevNest Academy)',
      email: 'admin@devnest.academy',
      passwordHash: adminHash,
      role: 'admin',
      isActive: true,
    },
    { upsert: true }
  );

  // 2. Ensure Student (Omar Sherif / student.test@devnest.academy)
  const studentHash = await User.hashPassword('Student@123');
  const student = await User.findOneAndUpdate(
    { studentCode: 'DN-FE-26-001' },
    {
      fullName: 'عمر شريف',
      email: 'student@devnest.academy',
      passwordHash: studentHash,
      role: 'student',
      isActive: true,
    },
    { returnDocument: 'after' }
  );

  // 3. Ensure Active Cohort Enrollment
  await Enrollment.findOneAndUpdate(
    { studentId: student._id, courseId: course._id },
    {
      accessType: 'cohort',
      cohortName: 'دفعة شتاء 2026',
      status: 'active',
      features: {
        canAccessTasks: true,
        canAccessExams: true,
        showInLeaderboard: true,
      },
      enrolledAt: new Date(),
    },
    { upsert: true }
  );

  // 4. Ensure at least one published lesson with video
  const existingLesson = await Lesson.findOne({ courseId: course._id, isPublished: true });
  if (!existingLesson) {
    await Lesson.create({
      courseId: course._id,
      moduleNumber: 1,
      moduleTitle: 'الوحدة الأولى: أساسيات بنية الويب الحديثة',
      title: 'المحاضرة 01: مقدمة معمارية الويب و HTML5 / Modern CSS',
      order: 1,
      youtubeVideoId: 'L_LUpnjgPso',
      duration: '1:45:00',
      isPublished: true,
      description: 'شرح شامل ومفصل لمعمارية تطبيقات الويب وهيكلة الواجهات الحديثة.',
      resources: [
        { title: 'ملخص المحاضرة وملاحظات الكود', url: 'https://github.com/devnest-academy', type: 'github' },
      ],
    });
  }

  // 5. Ensure at least one active Task
  const existingTask = await Task.findOne({ courseId: course._id, isActive: true });
  if (!existingTask) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    await Task.create({
      courseId: course._id,
      moduleNumber: 1,
      moduleTitle: 'الوحدة الأولى: أساسيات بنية الويب',
      title: 'المهمة 01: بناء متجر تفاعلي متجاوب مع سلة المشتريات (Cart State)',
      description: 'قم ببناء واجهة متجر تفاعلي متجاوب يدعم إضافة وحذف المنتجات وحساب المجموع الكلي.',
      requirements: [
        'كتابة كود نظيف وفق مبادئ Clean Code',
        'التوافق مع الشاشات المختلفة (Mobile-First)',
        'رفع المشروع على مستودع GitHub عام',
      ],
      deadline,
      maxScore: 100,
      allowedLinkTypes: ['github', 'drive'],
      isActive: true,
    });
  }

  // 6. Ensure at least one published Assessment
  const existingExam = await Assessment.findOne({ courseId: course._id, isPublished: true });
  if (!existingExam) {
    await Assessment.create({
      courseId: course._id,
      type: 'exam',
      title: 'الامتحان النظري الأول: مفاهيم هندسة الواجهات و JavaScript الحديثة',
      description: 'اختبار نظري خاضع للمراقبة المشددة ضد الغش والشاشة الكاملة.',
      durationMinutes: 20,
      passingScore: 70,
      strictAntiCheat: true,
      maxViolations: 3,
      isPublished: true,
      questions: [
        {
          text: 'ما هي الوظيفة الأساسية للـ Virtual DOM في مكتبة React؟',
          options: [
            'مضاعفة استهلاك الذاكرة في المتصفح',
            'إجراء عملية Reconciliation لتقليل التعديل المباشر على DOM الحقيقي',
            'إرسال طلبات HTTP تلقائية إلى السيرفر',
            'تشفير كود JavaScript في الإنتاج',
          ],
          correctOptionIndex: 1,
          points: 10,
          explanation: 'الـ Virtual DOM يتيح ميزة Diffing / Reconciliation لتحديث الأجزاء المتغيرة فقط.',
        },
        {
          text: 'أي من الـ Hooks التالية يُستخدم لتخزين قيمة محسوبة (Memoized Value) بين عمليات الـ Render؟',
          options: ['useEffect', 'useCallback', 'useMemo', 'useRef'],
          correctOptionIndex: 2,
          points: 10,
          explanation: 'useMemo يحفظ ناتج الحساب، بينما useCallback يحفظ تعريف الدالة.',
        },
      ],
    });
  }

  console.log('✅ Demo accounts and content seeded successfully!');
  process.exit(0);
}

seedDemoAccounts();
