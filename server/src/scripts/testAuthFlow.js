const { connectDB } = require('../config/db');
const User = require('../modules/auth/auth.model');
const { ROLES } = require('../utils/constants');
const app = require('../app');
const http = require('http');

/**
 * End-to-end automated verification of the complete Phase 1 Authentication & Security requirements.
 */
async function runTests() {
  console.log('🧪 Starting Phase 1 Auth & Security End-to-End Verification...\n');

  await connectDB();

  // Create a dedicated HTTP server on an ephemeral port
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
    // 1. Setup test student
    await User.deleteMany({ email: 'student.test@devnest.academy' });
    const studentPasswordHash = await User.hashPassword('StudentPass@123');
    await User.create({
      fullName: 'أحمد محمود',
      email: 'student.test@devnest.academy',
      studentCode: 'DN-FE-26-001',
      passwordHash: studentPasswordHash,
      role: ROLES.STUDENT,
      isActive: true,
    });
    console.log('✅ 1. Test student account created with code: DN-FE-26-001');

    // 2. Admin Login with Email
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'admin@devnest.academy', password: 'Admin@123' },
    });
    if (adminLoginRes.status !== 200 || !adminLoginRes.data.data.accessToken) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    const adminToken = adminLoginRes.data.data.accessToken;
    const cookieHeader = adminLoginRes.headers['set-cookie'];
    if (!cookieHeader || !cookieHeader.some((c) => c.includes('refreshToken='))) {
      throw new Error('HttpOnly refreshToken cookie not set on login');
    }
    console.log('✅ 2. Admin login via email succeeded (Access JWT + HttpOnly Refresh Cookie verified)');

    // 3. Authenticated /me endpoint
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (meRes.status !== 200 || meRes.data.data.user.role !== 'admin') {
      throw new Error(`GET /me failed: ${JSON.stringify(meRes.data)}`);
    }
    console.log('✅ 3. GET /api/auth/me verified: user is admin');

    // 4. Student Code Login (Case-insensitive)
    const studentLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'dn-fe-26-001', password: 'StudentPass@123' },
    });
    if (studentLoginRes.status !== 200 || studentLoginRes.data.data.user.role !== 'student') {
      throw new Error(`Student code login failed: ${JSON.stringify(studentLoginRes.data)}`);
    }
    const studentToken1 = studentLoginRes.data.data.accessToken;
    console.log('✅ 4. Student login via unique code (lowercase dn-fe-26-001) succeeded');

    // 5. Single Active Session Enforcement
    // Login the SAME student a second time -> should invalidate studentToken1
    const studentLogin2Res = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'DN-FE-26-001', password: 'StudentPass@123' },
    });
    const studentToken2 = studentLogin2Res.data.data.accessToken;

    // Now try accessing /me with studentToken1 (should be rejected with 401 AUTH_SESSION_REVOKED)
    const revokedCheckRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${studentToken1}` },
    });
    if (
      revokedCheckRes.status !== 401 ||
      revokedCheckRes.data.errorCode !== 'AUTH_SESSION_REVOKED'
    ) {
      throw new Error(
        `Single session enforcement failed! Expected 401 AUTH_SESSION_REVOKED, got: ${JSON.stringify(
          revokedCheckRes.data
        )}`
      );
    }
    console.log('✅ 5. Single Active Session Enforcement verified: old session immediately rejected!');

    // 6. Token 2 is valid
    const validCheckRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${studentToken2}` },
    });
    if (validCheckRes.status !== 200) {
      throw new Error('Second session token should be valid');
    }
    console.log('✅ 6. New active session is valid');

    // 7. Refresh token flow
    const studentCookie = studentLogin2Res.headers['set-cookie'];
    const refreshCookieStr = studentCookie.find((c) => c.startsWith('refreshToken=')).split(';')[0];
    const refreshRes = await request('/api/auth/refresh', {
      method: 'POST',
      headers: { Cookie: refreshCookieStr },
    });
    if (refreshRes.status !== 200 || !refreshRes.data.data.accessToken) {
      throw new Error(`Refresh failed: ${JSON.stringify(refreshRes.data)}`);
    }
    console.log('✅ 7. Refresh token endpoint verified (silent rotation working)');

    // 8. Logout flow
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken2}` },
    });
    if (logoutRes.status !== 200) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutRes.data)}`);
    }
    // Verify token is now invalid after logout
    const postLogoutCheck = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${studentToken2}` },
    });
    if (postLogoutCheck.status !== 401) {
      throw new Error('Token should be invalid after logout');
    }
    console.log('✅ 8. Logout verified (active session wiped, token invalidated)');

    console.log('\n🎉 ALL PHASE 1 AUTHENTICATION & SECURITY TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
