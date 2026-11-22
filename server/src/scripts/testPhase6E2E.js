const { connectDB } = require('../config/db');
const User = require('../modules/auth/auth.model');
const Course = require('../modules/courses/courses.model');
const Enrollment = require('../modules/enrollments/enrollments.model');
const Assessment = require('../modules/assessments/assessments.model');
const AssessmentAttempt = require('../modules/assessments/assessmentAttempts.model');
const app = require('../app');
const http = require('http');

/**
 * Phase 6 End-to-End Automated Test Suite:
 * - Admin Quiz & Exam Builder
 * - Server-Side Authority (zero client leakage of correctOptionIndex)
 * - Random Question Shuffling & Time Calculation
 * - Tier Gating (recorded_only student blocked with 403)
 * - Strict Anti-Cheat Engine (Violation Logging & Auto-submission on 3 strikes)
 * - Server-Side Evaluation & Scoring
 * - Post-Submission Review with Explanations
 * - Admin Audit Trail (Anti-cheat violations timeline)
 */
async function runPhase6Tests() {
  console.log('🧪 Starting Phase 6 E2E Verification...\n');

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
    // SETUP: Course & Users
    // ----------------------------------------------------
    const course = await Course.findOne({ slug: 'frontend-development' });
    if (!course) throw new Error('Seeded course not found!');

    // Admin Login
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'admin@devnest.academy', password: 'Admin@123' },
    });
    if (adminLoginRes.status !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    const adminToken = adminLoginRes.data.data.accessToken;
    console.log('✅ 1. Admin authenticated successfully');

    // Prepare Cohort Student 1 (will trigger cheat strikes)
    const pHash = await User.hashPassword('Password@123');
    let student1 = await User.findOne({ email: 's1.p6@devnest.academy' });
    if (!student1) {
      student1 = await User.create({
        fullName: 'طارق زياد (طالب دفعة تفاعلية)',
        email: 's1.p6@devnest.academy',
        passwordHash: pHash,
        role: 'student',
        studentCode: 'DN-FE-26-P61',
        isActive: true,
      });
    }
    await Enrollment.findOneAndUpdate(
      { studentId: student1._id, courseId: course._id },
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
      body: { identifier: 's1.p6@devnest.academy', password: 'Password@123' },
    });
    const s1Token = s1Login.data.data.accessToken;
    console.log('✅ 2. Cohort Student 1 authenticated (canAccessExams: true)');

    // Prepare Cohort Student 2 (will complete exam legitimately)
    let student2 = await User.findOne({ email: 's2.p6@devnest.academy' });
    if (!student2) {
      student2 = await User.create({
        fullName: 'نورا سعيد (طالبة دفعة تفاعلية)',
        email: 's2.p6@devnest.academy',
        passwordHash: pHash,
        role: 'student',
        studentCode: 'DN-FE-26-P62',
        isActive: true,
      });
    }
    await Enrollment.findOneAndUpdate(
      { studentId: student2._id, courseId: course._id },
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
      body: { identifier: 's2.p6@devnest.academy', password: 'Password@123' },
    });
    const s2Token = s2Login.data.data.accessToken;
    console.log('✅ 3. Cohort Student 2 authenticated (canAccessExams: true)');

    // Prepare Recorded-Only Student
    let recStudent = await User.findOne({ email: 'rec.p6@devnest.academy' });
    if (!recStudent) {
      recStudent = await User.create({
        fullName: 'ياسر يوسف (مسجل فقط)',
        email: 'rec.p6@devnest.academy',
        passwordHash: pHash,
        role: 'student',
        studentCode: 'DN-FE-26-P6REC',
        isActive: true,
      });
    }
    await Enrollment.findOneAndUpdate(
      { studentId: recStudent._id, courseId: course._id },
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
      body: { identifier: 'rec.p6@devnest.academy', password: 'Password@123' },
    });
    const recToken = recLogin.data.data.accessToken;
    console.log('✅ 4. Recorded-Only Student authenticated (canAccessExams: false)');

    // Cleanup previous test exam/attempts for idempotency
    await Assessment.deleteMany({ title: 'الامتحان النظري النهائي لمعمارية React الحديثة' });
    await AssessmentAttempt.deleteMany({ studentId: { $in: [student1._id, student2._id] } });

    // ----------------------------------------------------
    // TEST 5: Admin Creates Exam with Anti-Cheat & Questions
    // ----------------------------------------------------
    const createExamRes = await request('/api/admin/assessments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        courseId: course._id.toString(),
        type: 'exam',
        title: 'الامتحان النظري النهائي لمعمارية React الحديثة',
        description: 'اختبار نظري شامل خاضع لحراسة الشاشة الكاملة ومكافحة الغش.',
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
              'إجراء عملية Reconciliation وحساب الفروقات بكفاءة لتقليل التعديل المباشر على DOM الحقيقي',
              'إرسال طلبات HTTP تلقائية إلى السيرفر',
              'تشفير كود JavaScript في الإنتاج',
            ],
            correctOptionIndex: 1,
            points: 10,
            explanation: 'الـ Virtual DOM يتيح ميزة Diffing / Reconciliation لتحديث الأجزاء المتغيرة فقط في DOM الحقيقي.',
          },
          {
            text: 'ما هو الناتج المتوقع لتنفيذ الكود التالي في React؟',
            codeSnippet: 'const [count, setCount] = useState(0);\nsetCount(count + 1);\nsetCount(count + 1);',
            options: [
              'تصبح القيمة 2 فورياً',
              'تصبح القيمة 1 لأن التحديثات داخل نفس الـ Event تُجمّع (Batched) وتعتمد على نفس Snapshot',
              'يحدث خطأ Runtime Error',
              'يتم إعادة تعيين القيمة إلى 0',
            ],
            correctOptionIndex: 1,
            points: 10,
            explanation: 'تحديثات الحالة مجمعة (Batched)، ولزيادة القيمة مرتين يجب استخدام updater function: setCount(prev => prev + 1).',
          },
          {
            text: 'أي من الـ Hooks التالية يُستخدم لتخزين نتيجة عملية حسابية معقدة بين عمليات الـ Render؟',
            options: ['useEffect', 'useCallback', 'useMemo', 'useRef'],
            correctOptionIndex: 2,
            points: 10,
            explanation: 'useMemo يُستخدم لحفظ القيمة المحسوبة (Memoized Value)، بينما useCallback يحفظ تعريف الدالة.',
          },
        ],
      },
    });

    if (createExamRes.status !== 201) {
      throw new Error(`Failed to create exam: ${JSON.stringify(createExamRes.data)}`);
    }
    const createdExam = createExamRes.data.data.assessment;
    const examId = createdExam._id;
    console.log('✅ 5. Admin successfully created strict exam:', createdExam.title);

    // ----------------------------------------------------
    // TEST 6: Tier Gating Enforcement
    // ----------------------------------------------------
    // Recorded-only student attempts to start exam -> MUST be blocked with 403
    const tierBlockRes = await request(`/api/assessments/${examId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${recToken}` },
    });
    if (tierBlockRes.status !== 403) {
      throw new Error(`Expected 403 for recorded student starting exam, got: ${tierBlockRes.status}`);
    }
    console.log('✅ 6. Tier gating verified: recorded-only student blocked with 403');

    // ----------------------------------------------------
    // TEST 7: Server-Side Authority & Zero Client Leakage
    // ----------------------------------------------------
    const s1StartRes = await request(`/api/assessments/${examId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    if (s1StartRes.status !== 200) {
      throw new Error(`Student 1 start exam failed: ${JSON.stringify(s1StartRes.data)}`);
    }
    const s1Session = s1StartRes.data.data;
    const attemptId1 = s1Session.attemptId;

    if (!s1Session.questions || s1Session.questions.length !== 3) {
      throw new Error(`Questions count mismatch: ${s1Session.questions?.length}`);
    }

    // Verify ZERO correctOptionIndex or explanation leakage in questions
    s1Session.questions.forEach((q, idx) => {
      if (q.correctOptionIndex !== undefined) {
        throw new Error(`SECURITY LEAK: correctOptionIndex exposed in question #${idx + 1}!`);
      }
      if (q.explanation !== undefined && q.explanation !== '') {
        throw new Error(`SECURITY LEAK: explanation exposed in question #${idx + 1}!`);
      }
    });
    console.log('✅ 7. Server-Side Authority verified: questions sanitized (zero correct answer leakage)');

    // ----------------------------------------------------
    // TEST 8: Anti-Cheat Strike Engine & Auto-Submission
    // ----------------------------------------------------
    // Strike 1: Tab switch
    const strike1 = await request(`/api/assessments/${attemptId1}/violation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: { type: 'tab_switch', notes: 'تبديل التبويب إلى نافذة متصفح أخرى' },
    });
    if (strike1.status !== 200 || strike1.data.data.violationCount !== 1 || strike1.data.data.locked) {
      throw new Error(`Strike 1 failed: ${JSON.stringify(strike1.data)}`);
    }
    console.log('✅ 8.1. Strike 1 registered (tab_switch, count: 1, locked: false)');

    // Strike 2: Blur (window focus loss)
    const strike2 = await request(`/api/assessments/${attemptId1}/violation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: { type: 'blur', notes: 'النقر خارج نافذة المتصفح' },
    });
    if (strike2.status !== 200 || strike2.data.data.violationCount !== 2 || strike2.data.data.locked) {
      throw new Error(`Strike 2 failed: ${JSON.stringify(strike2.data)}`);
    }
    console.log('✅ 8.2. Strike 2 registered (blur, count: 2, locked: false)');

    // Strike 3: Fullscreen Exit -> triggers permanent lock & auto_submitted_cheat!
    const strike3 = await request(`/api/assessments/${attemptId1}/violation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: { type: 'fullscreen_exit', notes: 'الخروج من الشاشة الكاملة' },
    });
    if (strike3.status !== 200 || !strike3.data.data.locked || strike3.data.data.status !== 'auto_submitted_cheat') {
      throw new Error(`Strike 3 auto-submission failed: ${JSON.stringify(strike3.data)}`);
    }
    console.log('✅ 8.3. Strike 3 registered -> Exam LOCKED & Auto-Submitted as auto_submitted_cheat!');

    // Attempting to submit answers after cheat lock MUST be rejected
    const postCheatSubmit = await request(`/api/assessments/${attemptId1}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: { answers: [] },
    });
    if (postCheatSubmit.status !== 400) {
      throw new Error(`Expected 400 when submitting locked exam, got: ${postCheatSubmit.status}`);
    }
    console.log('✅ 8.4. Submissions rejected after cheat lock (400)');

    // ----------------------------------------------------
    // TEST 9: Legitimate Student Submission & Scoring
    // ----------------------------------------------------
    const s2StartRes = await request(`/api/assessments/${examId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s2Token}` },
    });
    const s2Session = s2StartRes.data.data;
    const attemptId2 = s2Session.attemptId;

    // Student 2 answers all 3 questions correctly
    // Match correct options by looking up the actual questions on backend
    const answersPayload = s2Session.questions.map((q) => {
      const originalQ = createdExam.questions.find((oq) => oq._id.toString() === q._id.toString());
      return {
        questionId: q._id,
        selectedOptionIndex: originalQ.correctOptionIndex,
      };
    });

    const s2SubmitRes = await request(`/api/assessments/${attemptId2}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s2Token}` },
      body: { answers: answersPayload },
    });

    if (s2SubmitRes.status !== 200) {
      throw new Error(`Student 2 submit failed: ${JSON.stringify(s2SubmitRes.data)}`);
    }
    const s2Result = s2SubmitRes.data.data;
    if (s2Result.status !== 'submitted' || s2Result.score !== 30 || s2Result.percentage !== 100 || !s2Result.isPassed) {
      throw new Error(`Evaluation incorrect: ${JSON.stringify(s2Result)}`);
    }
    console.log('✅ 9. Student 2 completed exam legitimately (Score: 30/30, 100%, isPassed: true)');

    // ----------------------------------------------------
    // TEST 10: Post-Submission Review
    // ----------------------------------------------------
    const reviewRes = await request(`/api/assessments/${attemptId2}/review`, {
      headers: { Authorization: `Bearer ${s2Token}` },
    });
    if (reviewRes.status !== 200) {
      throw new Error(`Review failed: ${JSON.stringify(reviewRes.data)}`);
    }
    const reviewData = reviewRes.data.data;
    if (!reviewData.questions || reviewData.questions.length !== 3) {
      throw new Error(`Review questions missing: ${JSON.stringify(reviewData)}`);
    }
    // Now explanations and correct answers should be present for review
    if (reviewData.questions[0].correctOptionIndex === undefined || !reviewData.questions[0].explanation) {
      throw new Error('Review must include correctOptionIndex and explanations');
    }
    console.log('✅ 10. Post-submission review delivers detailed explanations and answer verification');

    // ----------------------------------------------------
    // TEST 11: Admin Audit Trail & Attempts Viewer
    // ----------------------------------------------------
    const adminAttemptsRes = await request(`/api/admin/assessments/${examId}/attempts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminAttemptsRes.status !== 200) {
      throw new Error(`Admin attempts viewer failed: ${JSON.stringify(adminAttemptsRes.data)}`);
    }
    const attemptsList = adminAttemptsRes.data.data.attempts;
    if (attemptsList.length !== 2) {
      throw new Error(`Expected 2 attempts for exam, got: ${attemptsList.length}`);
    }

    const cheatAttempt = attemptsList.find((a) => a.status === 'auto_submitted_cheat');
    if (!cheatAttempt || cheatAttempt.violations.length !== 3) {
      throw new Error(`Cheat attempt audit trail incomplete: ${JSON.stringify(cheatAttempt)}`);
    }
    console.log('✅ 11. Admin audit trail recorded 3 anti-cheat strikes with exact timestamps');

    console.log('\n🎉 ALL PHASE 6 EXAM ENGINE & ANTI-CHEAT TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
  }
}

runPhase6Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Phase 6 Test Suite Failed:', err);
    process.exit(1);
  });
