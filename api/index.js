const app = require('../server/src/app');
const { connectDB } = require('../server/src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in serverless handler:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  }
  // Keep root and public endpoints as-is; ensure API routes have /api prefix
  if (req.url === '/' || req.url === '' || req.url === '/robots.txt' || req.url === '/sitemap.xml') {
    req.url = req.url || '/';
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
};
