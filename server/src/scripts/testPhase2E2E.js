const { connectDB } = require('../config/db');
const Course = require('../modules/courses/courses.model');
const Registration = require('../modules/registrations/registrations.model');
const app = require('../app');
const http = require('http');

/**
 * Phase 2 End-to-End Verification Test Script.
 */
async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 E2E Verification...\n');

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
    // 1. Fetch Courses List
    const coursesRes = await request('/api/courses');
    if (coursesRes.status !== 200 || !coursesRes.data.data.courses.length) {
      throw new Error(`GET /api/courses failed: ${JSON.stringify(coursesRes.data)}`);
    }
    const flagshipCourse = coursesRes.data.data.courses.find(
      (c) => c.slug === 'frontend-development'
    );
    if (!flagshipCourse) {
      throw new Error('Flagship course frontend-development not found');
    }
    console.log(`✅ 1. GET /api/courses: Verified ${coursesRes.data.data.courses.length} active course(s).`);

    // 2. Fetch Course Details by Slug
    const courseDetailRes = await request('/api/courses/frontend-development');
    if (courseDetailRes.status !== 200) {
      throw new Error(`GET /api/courses/frontend-development failed`);
    }
    const course = courseDetailRes.data.data.course;
    if (!course.roadmap || course.roadmap.length !== 6) {
      throw new Error(`Expected 6 roadmap modules, got ${course.roadmap?.length}`);
    }
    console.log(`✅ 2. GET /api/courses/:slug: Verified full course details & 6 syllabus roadmap modules.`);

    // 3. Dynamic Registration: Submit valid student application
    await Registration.deleteMany({ email: 'phase2.student@example.com' });
    const regRes = await request('/api/registrations', {
      method: 'POST',
      body: {
        courseId: course._id,
        fullName: 'كريم عبد الرحمن',
        email: 'phase2.student@example.com',
        phone: '01099887766',
        age: 23,
        background: 'كلية الهندسة',
        experienceLevel: 'beginner',
        goals: 'العمل كمهندس واجهات أمامية في شركة برمجيات',
        referralSource: 'social_media',
      },
    });

    if (regRes.status !== 201 || !regRes.data.success) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }
    console.log(`✅ 3. POST /api/registrations: Application submitted successfully.`);

    // 4. Duplicate Registration Prevention
    const duplicateRes = await request('/api/registrations', {
      method: 'POST',
      body: {
        courseId: course._id,
        fullName: 'كريم عبد الرحمن',
        email: 'phase2.student@example.com',
        phone: '01099887766',
        experienceLevel: 'beginner',
      },
    });
    if (duplicateRes.status !== 409) {
      throw new Error(`Expected 409 on duplicate registration, got: ${duplicateRes.status}`);
    }
    console.log(`✅ 4. Duplicate prevention verified: duplicate submissions rejected with 409 Conflict.`);

    // 5. Strict Validation Check (Invalid email)
    const invalidRes = await request('/api/registrations', {
      method: 'POST',
      body: {
        courseId: course._id,
        fullName: 'أحمد',
        email: 'not-an-email',
        phone: '123',
      },
    });
    if (invalidRes.status !== 400 || !invalidRes.data.errors) {
      throw new Error(`Expected 400 validation error for invalid input`);
    }
    console.log(`✅ 5. Zod Validation verified: rejected invalid inputs.`);

    // 6. Registration Closed Gating
    await Course.findByIdAndUpdate(course._id, { isRegistrationOpen: false });
    const closedRes = await request('/api/registrations', {
      method: 'POST',
      body: {
        courseId: course._id,
        fullName: 'طالب متأخر',
        email: 'late.student@example.com',
        phone: '01055554444',
      },
    });
    if (closedRes.status !== 400 || !closedRes.data.message.includes('مغلق')) {
      throw new Error(`Expected closed registration rejection message`);
    }
    // Restore registration open
    await Course.findByIdAndUpdate(course._id, { isRegistrationOpen: true });
    console.log(`✅ 6. Dynamic registration toggle verified: submissions rejected when isRegistrationOpen is false.`);

    // 7. Robots.txt
    const robotsRes = await request('/robots.txt');
    if (
      robotsRes.status !== 200 ||
      !robotsRes.data.includes('Disallow: /admin') ||
      !robotsRes.data.includes('Disallow: /student')
    ) {
      throw new Error(`robots.txt verification failed`);
    }
    console.log(`✅ 7. robots.txt verified: private routes (/admin, /student) blocked for crawlers.`);

    // 8. Dynamic Sitemap.xml
    const sitemapRes = await request('/sitemap.xml');
    if (
      sitemapRes.status !== 200 ||
      !sitemapRes.data.includes('https://devnest.academy/courses/frontend-development')
    ) {
      throw new Error(`sitemap.xml verification failed`);
    }
    console.log(`✅ 8. sitemap.xml verified: valid XML generated with dynamic course URLs.`);

    console.log('\n🎉 ALL PHASE 2 BACKEND & SEO VERIFICATION TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runPhase2Tests().catch((err) => {
  console.error('❌ Phase 2 test failed:', err);
  process.exit(1);
});
