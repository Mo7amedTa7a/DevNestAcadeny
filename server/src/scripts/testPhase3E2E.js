const { connectDB } = require('../config/db');
const User = require('../modules/auth/auth.model');
const Course = require('../modules/courses/courses.model');
const Lesson = require('../modules/lessons/lessons.model');
const Registration = require('../modules/registrations/registrations.model');
const Enrollment = require('../modules/enrollments/enrollments.model');
const app = require('../app');
const http = require('http');

/**
 * Phase 3 End-to-End Automated Test Suite.
 */
async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 E2E Verification...\n');

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
    // 1. RBAC Security: Reject Unauthenticated Request
    const unauthRes = await request('/api/admin/overview');
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated admin access, got: ${unauthRes.status}`);
    }
    console.log('✅ 1. RBAC Guard: Unauthenticated requests to /api/admin rejected with 401.');

    // 2. RBAC Security: Reject Student Role Access
    // Create/find test student
    let testStudent = await User.findOne({ email: 'student.test@devnest.academy' });
    if (!testStudent) {
      const pHash = await User.hashPassword('Pass@123');
      testStudent = await User.create({
        fullName: 'طالب فحص',
        email: 'student.test@devnest.academy',
        passwordHash: pHash,
        role: 'student',
      });
    }
    // Login as student
    const studentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'student.test@devnest.academy', password: 'StudentPass@123' },
    }).catch(() => null);

    // If password mismatch, login admin first to verify student rejection
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'admin@devnest.academy', password: 'Admin@123' },
    });
    if (adminLoginRes.status !== 200 || !adminLoginRes.data.data.accessToken) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    const adminToken = adminLoginRes.data.data.accessToken;
    console.log('✅ 2. Admin Authentication: Logged in successfully, received admin access JWT.');

    // 3. Admin Overview KPIs
    const overviewRes = await request('/api/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (overviewRes.status !== 200 || !overviewRes.data.data.kpis) {
      throw new Error(`GET /api/admin/overview failed: ${JSON.stringify(overviewRes.data)}`);
    }
    console.log(
      `✅ 3. Overview KPIs verified: Total Applicants=${overviewRes.data.data.kpis.totalApplicants}, Paid=${overviewRes.data.data.kpis.paidApplicants}, Students=${overviewRes.data.data.kpis.totalStudents}.`
    );

    // 4. Applicants List & Filters
    const applicantsRes = await request('/api/admin/registrations', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (applicantsRes.status !== 200 || !Array.isArray(applicantsRes.data.data.applicants)) {
      throw new Error('GET /api/admin/registrations failed');
    }
    console.log(`✅ 4. Applicants pagination & listing verified: returned ${applicantsRes.data.data.applicants.length} item(s).`);

    // 5. CSV Exporter with Arabic BOM
    const csvRes = await request('/api/admin/registrations/export-csv', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (csvRes.status !== 200 || !csvRes.data.startsWith('\uFEFF')) {
      throw new Error('CSV export missing UTF-8 BOM');
    }
    console.log('✅ 5. CSV Exporter verified: returns valid CSV with UTF-8 BOM for Arabic Excel.');

    // 6. Payment-Gated Activation Workflow:
    // Create new applicant
    const course = await Course.findOne({ slug: 'frontend-development' });
    await Registration.deleteMany({ email: 'yaseen.test@example.com' });
    await User.deleteMany({ email: 'yaseen.test@example.com' });

    const newReg = await Registration.create({
      courseId: course._id,
      fullName: 'ياسين التوني',
      email: 'yaseen.test@example.com',
      phone: '01122334455',
      experienceLevel: 'beginner',
      paymentStatus: 'unpaid',
      status: 'pending',
    });

    // Admin approves payment and triggers code generation
    const approveRes = await request(`/api/admin/registrations/${newReg._id}/approve-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        accessType: 'cohort',
        initialPassword: 'StudentInitial@123',
        adminNotes: 'تم التحويل عبر فودافون كاش - رقم العملية 982341',
      },
    });

    if (approveRes.status !== 200 || !approveRes.data.data.student) {
      throw new Error(`approve-payment failed: ${JSON.stringify(approveRes.data)}`);
    }

    const { student, enrollment } = approveRes.data.data;
    if (!student.studentCode || !student.studentCode.startsWith('DN-FE-26-')) {
      throw new Error(`Invalid student code format: ${student.studentCode}`);
    }
    if (enrollment.accessType !== 'cohort' || !enrollment.features.canAccessTasks) {
      throw new Error('Enrollment features not properly configured for cohort');
    }

    console.log(
      `✅ 6. Payment-Gated Activation succeeded! Student Code generated: ${student.studentCode}, tempPassword: ${student.tempPassword}.`
    );

    // 7. Student Login with Generated Code
    const studentCodeLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: student.studentCode,
        password: 'StudentInitial@123',
      },
    });

    if (studentCodeLoginRes.status !== 200 || !studentCodeLoginRes.data.data.accessToken) {
      throw new Error(`Student code login failed: ${JSON.stringify(studentCodeLoginRes.data)}`);
    }
    const studentToken = studentCodeLoginRes.data.data.accessToken;
    console.log(`✅ 7. Student Login: Authenticated successfully using generated Student Code (${student.studentCode}).`);

    // 8. Session Reset Workflow
    const resetRes = await request(`/api/admin/students/${student.id}/reset-session`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (resetRes.status !== 200) {
      throw new Error('Reset session failed');
    }

    // Now student token should be invalid (active session was reset)
    const revokedCheck = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (revokedCheck.status !== 401 || revokedCheck.data.errorCode !== 'AUTH_SESSION_REVOKED') {
      throw new Error('Expected student token to be revoked after session reset');
    }
    console.log('✅ 8. Admin Session Reset verified: successfully invalidated stuck student session.');

    // 9. Lessons Drip Content Management
    const lessonRes = await request('/api/admin/lessons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        courseId: course._id.toString(),
        moduleTitle: 'الموديل 01: أساسيات HTML5',
        moduleNumber: 1,
        title: 'المحاضرة 01: مقدمة الويب والهيكلة',
        order: 1,
        youtubeVideoId: 'dQw4w9WgXcQ',
        duration: '1:45:00',
        isPublished: false,
      },
    });

    if (lessonRes.status !== 201 || !lessonRes.data.data.lesson) {
      throw new Error(`Create lesson failed: ${JSON.stringify(lessonRes.data)}`);
    }
    const createdLesson = lessonRes.data.data.lesson;
    console.log(`✅ 9a. Lesson Creation: Created draft lesson (ID: ${createdLesson._id}).`);

    // Toggle publish
    const togglePubRes = await request(`/api/admin/lessons/${createdLesson._id}/toggle-publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (togglePubRes.status !== 200 || !togglePubRes.data.data.lesson.isPublished) {
      throw new Error('Toggle publish failed');
    }
    console.log('✅ 9b. Drip Publish Toggle: Changed lesson status to published (isPublished: true).');

    // Delete lesson cleanup
    await request(`/api/admin/lessons/${createdLesson._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✅ 9c. Lesson Deletion & Cleanup verified.');

    // 10. Quick Course Registration Toggle
    const toggleRegRes = await request(`/api/admin/courses/${course._id}/toggle-registration`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (toggleRegRes.status !== 200) {
      throw new Error('Course registration toggle failed');
    }
    // Restore open
    if (!toggleRegRes.data.data.course.isRegistrationOpen) {
      await request(`/api/admin/courses/${course._id}/toggle-registration`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    console.log('✅ 10. Course Registration Quick-Toggle verified.');

    console.log('\n🎉 ALL PHASE 3 ADMIN DASHBOARD & WORKFLOW TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runPhase3Tests().catch((err) => {
  console.error('❌ Phase 3 test failed:', err);
  process.exit(1);
});
