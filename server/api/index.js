const app = require('../src/app');
const { connectDB } = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in serverless handler:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGO_URI is set in Vercel settings.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  }

  // Restore original request path if rewritten or passed by Vercel
  const originalPath = req.headers['x-matched-path'] || req.url || '';
  if (originalPath && !originalPath.includes('/api/index.js')) {
    req.url = originalPath;
  }

  // Keep root and public endpoints as-is; ensure API routes have /api prefix
  if (req.url === '/' || req.url === '' || req.url === '/robots.txt' || req.url === '/sitemap.xml') {
    req.url = req.url || '/';
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
};
