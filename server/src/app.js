const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { corsOptions } = require('./config/cors');
const { RATE_LIMITS } = require('./utils/constants');
const { errorMiddleware } = require('./middlewares/error.middleware');
const { AppError } = require('./utils/AppError');
const { ERROR_CODES } = require('./utils/constants');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const coursesRoutes = require('./modules/courses/courses.routes');
const registrationsRoutes = require('./modules/registrations/registrations.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const studentRoutes = require('./modules/student/student.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');
const tasksAdminRoutes = require('./modules/tasks/tasksAdmin.routes');
const leaderboardRoutes = require('./modules/leaderboard/leaderboard.routes');
const assessmentsRoutes = require('./modules/assessments/assessments.routes');
const assessmentsAdminRoutes = require('./modules/assessments/assessmentsAdmin.routes');
const Course = require('./modules/courses/courses.model');

const app = express();

// Performance — Compression middleware (Gzip / Brotli)
app.use(compression());

// ----- Security Middleware -----

// 1. Helmet — HTTP security headers + strict CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        frameSrc: ["'self'", 'https://www.youtube.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// 2. CORS — strict allowlist
app.use(cors(corsOptions));

// 3. JSON body parser — 100kb limit
app.use(express.json({ limit: '100kb' }));

// 4. URL-encoded body parser
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// 5. MongoDB query sanitization — prevent NoSQL injection (Express 5 compat)
// express-mongo-sanitize tries to set req.query which is read-only in Express 5,
// so we sanitize only req.body and req.params
app.use((req, _res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params);
  }
  next();
});

// 6. Cookie parser
app.use(cookieParser());

// ----- Rate Limiters -----

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GLOBAL.windowMs,
  max: RATE_LIMITS.GLOBAL.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', globalLimiter);

// Strict rate limiter for auth login
const authLoginLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH_LOGIN.windowMs,
  max: process.env.NODE_ENV === 'development' ? 100 : RATE_LIMITS.AUTH_LOGIN.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'لقد تجاوزت عدد محاولات الدخول المسموح بها، يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.',
    errorCode: 'AUTH_TOO_MANY_ATTEMPTS',
  },
});

// Rate limiter for assessments & exam attempts
const assessmentLimiter = rateLimit({
  windowMs: RATE_LIMITS.ASSESSMENT.windowMs,
  max: RATE_LIMITS.ASSESSMENT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many assessment attempts, please try again later' },
});

// ----- API Routes -----

app.use('/api/auth/login', authLoginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/tasks', tasksAdminRoutes);
app.use('/api/admin/assessments', assessmentsAdminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/assessments', assessmentLimiter, assessmentsRoutes);

// Root status check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'DevNest Academy API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      courses: '/api/courses',
      auth: '/api/auth/login',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'DevNest Academy API is running', timestamp: new Date().toISOString() });
});

// ----- Public SEO Endpoints -----

// 1. robots.txt — Crawler instructions
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Allow: /courses/
Disallow: /admin
Disallow: /admin/*
Disallow: /student
Disallow: /student/*
Disallow: /api/

Sitemap: https://devnest.academy/sitemap.xml
`);
});

// 2. sitemap.xml — Dynamic XML sitemap
app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const courses = await Course.find({ isActive: true }).select('slug updatedAt').lean();
    const siteUrl = 'https://devnest.academy';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static public routes
    xml += `  <url>\n    <loc>${siteUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${siteUrl}/register</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${siteUrl}/login</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

    // Dynamic course routes
    courses.forEach((c) => {
      const lastMod = c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString();
      xml += `  <url>\n    <loc>${siteUrl}/courses/${c.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
});

// ----- 404 Handler -----

app.all('{*path}', (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, ERROR_CODES.NOT_FOUND));
});

// ----- Global Error Handler -----

app.use(errorMiddleware);

module.exports = app;
