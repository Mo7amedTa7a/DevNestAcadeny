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
  // Ensure req.url has /api prefix if Vercel rewrite stripped it
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }

  return app(req, res);
};
