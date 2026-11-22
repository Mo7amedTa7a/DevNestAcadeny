const User = require('../modules/auth/auth.model');
const { connectDB } = require('../config/db');
const { ROLES } = require('../utils/constants');

/**
 * Seed a default admin user for development.
 * Run with: npm run seed:admin
 */
const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: ROLES.ADMIN });

    if (existingAdmin) {
      console.log(`⚠️ Admin already exists: ${existingAdmin.email}`);
      process.exit(0);
    }

    const passwordHash = await User.hashPassword('MhamedTaha@123');

    const admin = await User.create({
      fullName: 'DevNest Admin',
      email: 'admin@devnest.academy',
      passwordHash,
      role: ROLES.ADMIN,
      isActive: true,
    });

    console.log(`✅ Admin created: ${admin.email} (password: MhamedTaha@123)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
