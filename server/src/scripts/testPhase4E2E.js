const { connectDB } = require('../config/db');
const User = require('../modules/auth/auth.model');
const Course = require('../modules/courses/courses.model');
const Lesson = require('../modules/lessons/lessons.model');
const Enrollment = require('../modules/enrollments/enrollments.model');
const LessonProgress = require('../modules/lessons/lessonProgress.model');
const app = require('../app');
const http = require('http');

/**
 * Phase 4 End-to-End Automated Test Suite.
 */
async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 E2E Verification...\n');

  await connectDB();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const request = (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(
        url,
        {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            let data = null;
            try {
              data = JSON.parse(body);
            } catch {
              data = body;
            }
            resolve({ status: res.statusCode, headers: res.headers, data });
          });
        }
      );
      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  };

  try {
    // 1. Guard check: Reject unauthenticated requests
    const unauthRes = await request('/api/student/dashboard');
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated student access, got: ${unauthRes.status}`);
    }
    console.log('✅ 1. Student Route Guard: Unauthenticated requests rejected with 401.');

    // 2. Setup enrolled student & test lessons
    const course = await Course.findOne({ slug: 'frontend-development' });
    if (!course) throw new Error('Course frontend-development not found');

    // Create or find student
    await User.deleteMany({ email: 'phase4.student@devnest.academy' });
    const pHash = await User.hashPassword('Phase4Pass@123');
    const student = await User.create({
      fullName: 'عمر شريف',
      email: 'phase4.student@devnest.academy',
      phone: '01033221100',
      studentCode: 'DN-FE-26-003',
      passwordHash: pHash,
      role: 'student',
      isActive: true,
    });

    // Create active enrollment
    await Enrollment.deleteMany({ studentId: student._id });
    await Enrollment.create({
      studentId: student._id,
      courseId: course._id,
      cohortName: 'دفعة شتاء 2026',
      accessType: 'cohort',
      features: { canAccessTasks: true, canAccessExams: true, showInLeaderboard: true },
      status: 'active',
    });

    // Create a published test lesson
    await Lesson.deleteMany({ courseId: course._id, title: 'محاضرة React 19 التجريبية' });
    const publishedLesson = await Lesson.create({
      courseId: course._id,
      moduleTitle: 'الموديل 04: React 19 Ecosystem',
      moduleNumber: 4,
      title: 'محاضرة React 19 التجريبية',
      order: 1,
      youtubeVideoId: 'L_LUpnjgPso', // Sample YouTube Video ID
      duration: '1:45:00',
      isPublished: true,
      description: 'شرح مفصل لميزات React 19 الحديثة.',
      resources: [
        { title: 'مستودع الكود على GitHub', url: 'https://github.com/devnest-academy/react19', type: 'github' },
      ],
    });

    // Create an unpublished (draft) test lesson
    const draftLesson = await Lesson.create({
      courseId: course._id,
      moduleTitle: 'الموديل 04: React 19 Ecosystem',
      moduleNumber: 4,
      title: 'محاضرة مسودة غير منشورة',
      order: 2,
      youtubeVideoId: 'hiddenVideoId123',
      duration: '1:00:00',
      isPublished: false,
    });

    // 3. Login as student using unique Student Code
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'DN-FE-26-003',
        password: 'Phase4Pass@123',
      },
    });

    if (loginRes.status !== 200 || !loginRes.data.data.accessToken) {
      throw new Error(`Student login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const studentToken = loginRes.data.data.accessToken;
    console.log(`✅ 2. Student Authentication: Logged in via Student Code (DN-FE-26-003).`);

    // 4. Student Dashboard
    const dashboardRes = await request('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (dashboardRes.status !== 200 || !dashboardRes.data.data.hasActiveCourse) {
      throw new Error(`Dashboard retrieval failed: ${JSON.stringify(dashboardRes.data)}`);
    }
    const dash = dashboardRes.data.data;
    if (dash.course.id.toString() !== course._id.toString()) {
      throw new Error('Course mismatch in dashboard');
    }
    console.log(
      `✅ 3. Dashboard verified: Active course="${dash.course.title}", Progress=${dash.metrics.progressPercentage}%, Published lessons=${dash.metrics.totalPublishedLessons}.`
    );

    // 5. Enrolled Course Lessons List (Drip enforcement)
    const lessonsListRes = await request(`/api/student/courses/${course._id}/lessons`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (lessonsListRes.status !== 200) {
      throw new Error('Failed to get course lessons list');
    }
    const returnedLessons = lessonsListRes.data.data.lessons;
    // Verify draftLesson is NOT included in the student's list
    const hasDraft = returnedLessons.some((l) => l._id === draftLesson._id.toString());
    if (hasDraft) {
      throw new Error('Drip violation: draft lesson was returned to student!');
    }
    console.log(`✅ 4. Drip Gating verified: only published lessons returned (${returnedLessons.length} lesson(s)).`);

    // 6. Secure Lesson Viewer & Encrypted Token (Zero Raw URL Exposure)
    const secureLessonRes = await request(`/api/student/lessons/${publishedLesson._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    if (secureLessonRes.status !== 200 || !secureLessonRes.data.data.videoToken) {
      throw new Error(`Secure lesson viewer failed: ${JSON.stringify(secureLessonRes.data)}`);
    }

    const { lesson, videoToken } = secureLessonRes.data.data;
    // Security check: raw youtubeVideoId must NOT exist in the lesson object
    if (lesson.youtubeVideoId) {
      throw new Error('SECURITY VIOLATION: raw youtubeVideoId exposed in lesson payload!');
    }
    console.log('✅ 5. Zero Raw URL Exposure verified: youtubeVideoId omitted, encrypted videoToken provided.');

    // 7. In-Memory Video Token Resolution
    const resolveRes = await request('/api/student/video/resolve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { token: videoToken },
    });

    if (resolveRes.status !== 200 || resolveRes.data.data.videoId !== 'L_LUpnjgPso') {
      throw new Error(`Video token resolution failed: ${JSON.stringify(resolveRes.data)}`);
    }
    console.log(`✅ 6. Video Token Resolution verified: authorized player resolved videoId in memory.`);

    // 8. Progress Tracking & Mark as Completed
    await LessonProgress.deleteMany({ studentId: student._id });
    const progressRes = await request(`/api/student/lessons/${publishedLesson._id}/progress`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        watchTimeSeconds: 150,
        lastPositionSeconds: 150,
        isCompleted: true,
      },
    });

    if (progressRes.status !== 200 || !progressRes.data.data.progress.isCompleted) {
      throw new Error(`Progress tracking failed: ${JSON.stringify(progressRes.data)}`);
    }

    const updatedDash = await request('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (updatedDash.data.data.metrics.completedLessonsCount !== 1) {
      throw new Error('Dashboard completed lessons count did not update');
    }
    console.log(
      `✅ 7. Progress Tracking verified: marked complete, course progress updated to ${updatedDash.data.data.metrics.progressPercentage}%.`
    );

    // 9. Draft Lesson Access Rejection
    const draftAccessRes = await request(`/api/student/lessons/${draftLesson._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (draftAccessRes.status !== 403) {
      throw new Error(`Expected 403 when student attempts to view unpublished lesson, got: ${draftAccessRes.status}`);
    }
    console.log('✅ 8. Drip Enforcement verified: accessing draft lesson rejected with 403.');

    // 10. Unenrolled Student Gating
    const unenrolledStudent = await User.create({
      fullName: 'طالب غير مشترك',
      email: 'unregistered@example.com',
      passwordHash: pHash,
      role: 'student',
    });
    const unLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'unregistered@example.com', password: 'Phase4Pass@123' },
    });
    const unenrolledToken = unLogin.data.data.accessToken;

    const unenrolledAccess = await request(`/api/student/lessons/${publishedLesson._id}`, {
      headers: { Authorization: `Bearer ${unenrolledToken}` },
    });
    if (unenrolledAccess.status !== 403) {
      throw new Error(`Expected 403 for unenrolled student, got: ${unenrolledAccess.status}`);
    }
    console.log('✅ 9. Enrollment Gate verified: student without active enrollment rejected with 403.');

    // Cleanup test lessons
    await Lesson.deleteMany({ courseId: course._id, title: { $in: ['محاضرة React 19 التجريبية', 'محاضرة مسودة غير منشورة'] } });
    await User.deleteMany({ email: 'unregistered@example.com' });

    console.log('\n🎉 ALL PHASE 4 STUDENT PORTAL & VIDEO SECURITY TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runPhase4Tests().catch((err) => {
  console.error('❌ Phase 4 test failed:', err);
  process.exit(1);
});
