const { connectDB } = require('../config/db');
const User = require('../modules/auth/auth.model');
const Course = require('../modules/courses/courses.model');
const Enrollment = require('../modules/enrollments/enrollments.model');
const Task = require('../modules/tasks/tasks.model');
const Submission = require('../modules/tasks/submissions.model');
const app = require('../app');
const http = require('http');

/**
 * Phase 5 End-to-End Automated Test Suite:
 * - Task Creation & Management (Admin)
 * - Strict Link Submission Validation (GitHub & Google Drive only)
 * - Anti-cheat & Malicious Link Rejection
 * - Tier Feature Gating (recorded_only vs cohort)
 * - Submission & Resubmission Life Cycle
 * - Code Review & Grading Engine (Admin)
 * - Live Cohort Leaderboard Engine & Podium Calculation
 */
async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 E2E Verification...\n');

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
    // ----------------------------------------------------
    // SETUP: Find or create Admin and test students
    // ----------------------------------------------------
    const course = await Course.findOne({ slug: 'frontend-development' });
    if (!course) throw new Error('Seeded course not found!');

    // Cleanup previous test tasks/submissions for idempotency
    await Task.deleteMany({ title: 'بناء تطبيق متجر مصغر متكامل مع Cart State' });

    // 1. Admin login
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'admin@devnest.academy', password: 'Admin@123' },
    });
    if (adminLoginRes.status !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    const adminToken = adminLoginRes.data.data.accessToken;
    console.log('✅ 1. Admin logged in successfully');

    const pHash = await User.hashPassword('Password@123');

    // 2. Prepare Cohort Student 1
    let cohortStudent1 = await User.findOne({ email: 'cohort1.p5@devnest.academy' });
    if (!cohortStudent1) {
      cohortStudent1 = await User.create({
        fullName: 'أحمد محمود (طالب دفعة تفاعلية)',
        email: 'cohort1.p5@devnest.academy',
        passwordHash: pHash,
        role: 'student',
        studentCode: 'DN-FE-26-P51',
        isActive: true,
      });
    }
    await Enrollment.findOneAndUpdate(
      { studentId: cohortStudent1._id, courseId: course._id },
      {
        accessType: 'cohort',
        cohortName: 'دفعة شتاء 2026',
        status: 'active',
        features: { canAccessTasks: true, canAccessExams: true, showInLeaderboard: true },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const s1Login = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'cohort1.p5@devnest.academy', password: 'Password@123' },
    });
    const s1Token = s1Login.data.data.accessToken;
    console.log('✅ 2. Cohort Student 1 authenticated (canAccessTasks: true)');

    // 3. Prepare Cohort Student 2
    let cohortStudent2 = await User.findOne({ email: 'cohort2.p5@devnest.academy' });
    if (!cohortStudent2) {
      cohortStudent2 = await User.create({
        fullName: 'سارة خالد (طالبة دفعة تفاعلية)',
        email: 'cohort2.p5@devnest.academy',
        passwordHash: pHash,
        role: 'student',
        studentCode: 'DN-FE-26-P52',
        isActive: true,
      });
    }
    await Enrollment.findOneAndUpdate(
      { studentId: cohortStudent2._id, courseId: course._id },
      {
        accessType: 'cohort',
        cohortName: 'دفعة شتاء 2026',
        status: 'active',
        features: { canAccessTasks: true, canAccessExams: true, showInLeaderboard: true },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const s2Login = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'cohort2.p5@devnest.academy', password: 'Password@123' },
    });
    const s2Token = s2Login.data.data.accessToken;
    console.log('✅ 3. Cohort Student 2 authenticated (canAccessTasks: true)');

    // 4. Prepare Recorded-Only Student
    let recordedStudent = await User.findOne({ email: 'recorded.p5@devnest.academy' });
    if (!recordedStudent) {
      recordedStudent = await User.create({
        fullName: 'خالد مصطفى (مسجل فقط)',
        email: 'recorded.p5@devnest.academy',
        passwordHash: pHash,
        role: 'student',
        studentCode: 'DN-FE-26-REC',
        isActive: true,
      });
    }
    await Enrollment.findOneAndUpdate(
      { studentId: recordedStudent._id, courseId: course._id },
      {
        accessType: 'recorded_only',
        cohortName: 'مسجل فقط',
        status: 'active',
        features: { canAccessTasks: false, canAccessExams: false, showInLeaderboard: false },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const recLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'recorded.p5@devnest.academy', password: 'Password@123' },
    });
    const recToken = recLogin.data.data.accessToken;
    console.log('✅ 4. Recorded-Only Student authenticated (canAccessTasks: false)');

    // Clean up any previous submissions for idempotency
    await Submission.deleteMany({ studentId: { $in: [cohortStudent1._id, cohortStudent2._id] } });

    // ----------------------------------------------------
    // TEST 5: Admin Creates Task
    // ----------------------------------------------------
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);

    const createTaskRes = await request('/api/admin/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        courseId: course._id.toString(),
        moduleNumber: 1,
        moduleTitle: 'أساسيات React ومكتبات الواجهة',
        title: 'بناء تطبيق متجر مصغر متكامل مع Cart State',
        description: 'قم ببناء تطبيق متجر بسيط يحتوي على قائمة منتجات وسلة مشتريات مع حفظ الحالة.',
        requirements: [
          'استخدام React Functional Components و Hooks',
          'تقسيم الكود وفق Clean Code',
          'رفع الكود على GitHub',
        ],
        deadline: deadlineDate.toISOString(),
        maxScore: 100,
        allowedLinkTypes: ['github', 'drive'],
        isActive: true,
      },
    });

    if (createTaskRes.status !== 201) {
      throw new Error(`Failed to create task: ${JSON.stringify(createTaskRes.data)}`);
    }
    const createdTask = createTaskRes.data.data.task;
    const taskId = createdTask._id;
    console.log('✅ 5. Admin successfully created task:', createdTask.title);

    // ----------------------------------------------------
    // TEST 6: Tier Gating Enforcement
    // ----------------------------------------------------
    // Recorded-only student attempts to submit task -> MUST be rejected with 403
    const tierGatingRes = await request(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${recToken}` },
      body: {
        submissionUrl: 'https://github.com/recorded-student/my-task',
        notes: 'Trying to submit without cohort tier',
      },
    });

    if (tierGatingRes.status !== 403) {
      throw new Error(`Expected 403 for recorded_only submission, got: ${tierGatingRes.status}`);
    }
    console.log('✅ 6. Tier gating verified: recorded-only student blocked from submitting tasks (403)');

    // ----------------------------------------------------
    // TEST 7: Link Submission Security & URL Validation
    // ----------------------------------------------------
    // 7.1 Reject javascript: scheme
    const jsInjectionRes = await request(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: {
        submissionUrl: 'javascript:alert(document.cookie)',
      },
    });
    if (jsInjectionRes.status !== 400) {
      throw new Error(`Expected 400 for javascript: URL, got: ${jsInjectionRes.status}`);
    }

    // 7.2 Reject non-https URL
    const httpRes = await request(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: {
        submissionUrl: 'http://github.com/user/project',
      },
    });
    if (httpRes.status !== 400) {
      throw new Error(`Expected 400 for http: URL, got: ${httpRes.status}`);
    }

    // 7.3 Reject malicious / unallowed domains
    const evilDomainRes = await request(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: {
        submissionUrl: 'https://evil-hacker.com/malware.zip',
      },
    });
    if (evilDomainRes.status !== 400) {
      throw new Error(`Expected 400 for evil domain, got: ${evilDomainRes.status}`);
    }
    console.log('✅ 7. Anti-cheat link validator blocked injection, http, and unallowed domains');

    // ----------------------------------------------------
    // TEST 8: Valid Submissions
    // ----------------------------------------------------
    // Student 1 submits valid GitHub URL
    const s1SubmitRes = await request(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: {
        submissionUrl: 'https://github.com/ahmed-devnest/react-store-app',
        notes: 'تم إنجاز جميع المتطلبات بالإضافة لـ LocalStorage persistence',
      },
    });

    if (s1SubmitRes.status !== 201) {
      throw new Error(`Student 1 submission failed: ${JSON.stringify(s1SubmitRes.data)}`);
    }
    const s1Sub = s1SubmitRes.data.data.submission;
    if (s1Sub.status !== 'pending' || s1Sub.linkType !== 'github') {
      throw new Error(`Invalid submission state: ${JSON.stringify(s1Sub)}`);
    }
    console.log('✅ 8. Student 1 submitted valid GitHub repo (status: pending, linkType: github)');

    // Student 2 submits valid Google Drive URL
    const s2SubmitRes = await request(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s2Token}` },
      body: {
        submissionUrl: 'https://drive.google.com/drive/folders/1ABCxyz987DevNestTask',
        notes: 'الملفات مضغوطة داخل مجلد Drive',
      },
    });

    if (s2SubmitRes.status !== 201) {
      throw new Error(`Student 2 submission failed: ${JSON.stringify(s2SubmitRes.data)}`);
    }
    const s2Sub = s2SubmitRes.data.data.submission;
    if (s2Sub.status !== 'pending' || s2Sub.linkType !== 'drive') {
      throw new Error(`Invalid submission state: ${JSON.stringify(s2Sub)}`);
    }
    console.log('✅ 9. Student 2 submitted valid Google Drive folder (status: pending, linkType: drive)');

    // ----------------------------------------------------
    // TEST 10: Admin Submissions Viewer & Summary
    // ----------------------------------------------------
    const adminTasksList = await request(`/api/admin/tasks?courseId=${course._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const taskWithSummary = adminTasksList.data.data.tasks.find((t) => t._id === taskId);
    if (!taskWithSummary || taskWithSummary.submissionsSummary.pending !== 2) {
      throw new Error(`Admin summary incorrect: ${JSON.stringify(taskWithSummary)}`);
    }
    console.log('✅ 10. Admin tasks summary shows 2 pending submissions');

    const adminSubmissionsRes = await request(`/api/admin/tasks/${taskId}/submissions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminSubmissionsRes.status !== 200 || adminSubmissionsRes.data.data.submissions.length !== 2) {
      throw new Error(`Admin failed to get submissions: ${JSON.stringify(adminSubmissionsRes.data)}`);
    }
    console.log('✅ 11. Admin retrieved full submissions list for task');

    // ----------------------------------------------------
    // TEST 12: Admin Grading & Code Review
    // ----------------------------------------------------
    // Attempting to give score > maxScore (150 > 100) -> MUST fail with 400
    const overScoreRes = await request(`/api/admin/tasks/submissions/${s1Sub._id}/grade`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        score: 150,
        feedback: 'Too much score',
        status: 'reviewed',
      },
    });
    if (overScoreRes.status !== 400) {
      throw new Error(`Expected 400 for score > maxScore, got: ${overScoreRes.status}`);
    }

    // Grade Student 1 with 95 points
    const gradeS1Res = await request(`/api/admin/tasks/submissions/${s1Sub._id}/grade`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        score: 95,
        feedback: 'بنية المكونات ممتازة ونظيفة جداً. استخدمت custom hooks بذكاء واحترافية. استمر!',
        status: 'reviewed',
      },
    });
    if (gradeS1Res.status !== 200) {
      throw new Error(`Grading Student 1 failed: ${JSON.stringify(gradeS1Res.data)}`);
    }
    console.log('✅ 12. Admin graded Student 1 (score: 95/100, feedback recorded)');

    // Grade Student 2 with 85 points
    const gradeS2Res = await request(`/api/admin/tasks/submissions/${s2Sub._id}/grade`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        score: 85,
        feedback: 'عمل رائع وتصميم متجاوب ممتاز. يُفضل فصل مكونات الـ Form في ملفات منفصلة.',
        status: 'reviewed',
      },
    });
    if (gradeS2Res.status !== 200) {
      throw new Error(`Grading Student 2 failed: ${JSON.stringify(gradeS2Res.data)}`);
    }
    console.log('✅ 13. Admin graded Student 2 (score: 85/100, feedback recorded)');

    // ----------------------------------------------------
    // TEST 14: Student Views Graded Tasks & Feedback
    // ----------------------------------------------------
    const studentTasksView = await request('/api/tasks', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    const s1TaskCard = studentTasksView.data.data.tasks.find((t) => t._id === taskId);
    if (!s1TaskCard || s1TaskCard.submission.score !== 95 || s1TaskCard.submission.status !== 'reviewed') {
      throw new Error(`Student 1 task card incorrect: ${JSON.stringify(s1TaskCard)}`);
    }
    console.log('✅ 14. Student sees evaluated score (95) and instructor feedback');

    // ----------------------------------------------------
    // TEST 15: Leaderboard Engine & Podium
    // ----------------------------------------------------
    // 15.1 Recorded-only student blocked from leaderboard
    const recLeaderboardRes = await request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    if (recLeaderboardRes.status !== 403) {
      throw new Error(`Expected 403 for recorded-only student on leaderboard, got: ${recLeaderboardRes.status}`);
    }
    console.log('✅ 15. Recorded-only student blocked from leaderboard (403)');

    // 15.2 Cohort Student 1 fetches leaderboard
    const s1LeaderboardRes = await request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    if (s1LeaderboardRes.status !== 200) {
      throw new Error(`Leaderboard fetch failed: ${JSON.stringify(s1LeaderboardRes.data)}`);
    }

    const lbData = s1LeaderboardRes.data.data;
    if (!lbData.topThree || lbData.topThree.length < 2) {
      throw new Error(`Leaderboard topThree missing: ${JSON.stringify(lbData)}`);
    }

    const rank1 = lbData.topThree[0];
    const rank2 = lbData.topThree[1];

    if (rank1.studentId.toString() !== cohortStudent1._id.toString() || rank1.totalPoints !== 95) {
      throw new Error(`Rank 1 should be Student 1 with 95 points, got: ${JSON.stringify(rank1)}`);
    }

    if (rank2.studentId.toString() !== cohortStudent2._id.toString() || rank2.totalPoints !== 85) {
      throw new Error(`Rank 2 should be Student 2 with 85 points, got: ${JSON.stringify(rank2)}`);
    }

    if (lbData.myRank.rank !== 1 || lbData.myRank.totalPoints !== 95) {
      throw new Error(`myRank incorrect for Student 1: ${JSON.stringify(lbData.myRank)}`);
    }

    console.log('✅ 16. Leaderboard engine accurately computed podium:');
    console.log(`       🥇 #1: ${rank1.fullName} (${rank1.totalPoints} pts)`);
    console.log(`       🥈 #2: ${rank2.fullName} (${rank2.totalPoints} pts)`);
    console.log(`       👤 Student 1 live rank: #${lbData.myRank.rank}`);

    // ----------------------------------------------------
    // TEST 16: Student Dashboard Reflects Cohort Rank
    // ----------------------------------------------------
    const s1Dashboard = await request('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    if (s1Dashboard.data.data.metrics.cohortRank !== 1) {
      throw new Error(`Dashboard cohortRank expected 1, got: ${s1Dashboard.data.data.metrics.cohortRank}`);
    }
    console.log('✅ 17. Student Dashboard reflects live cohort rank (#1)');

    console.log('\n🎉 ALL PHASE 5 END-TO-END TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
  }
}

runPhase5Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Phase 5 Test Suite Failed:', err);
    process.exit(1);
  });
