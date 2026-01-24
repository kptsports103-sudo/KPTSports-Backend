require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Delete existing admin users first
    await User.deleteMany({ 
      email: { 
        $in: [
          'superadmin@kpt.com',
          'admin@kpt.com', 
          'creator@kpt.com'
        ]
      }
    });
    console.log('Deleted existing admin users');

    // Hash passwords
    const superadminPassword = await bcrypt.hash('SuperAdmin@123', 10);
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const creatorPassword = await bcrypt.hash('Creator@123', 10);

    // Create SuperAdmin
    const superadmin = new User({
      name: 'Super Admin',
      email: 'superadmin@kpt.com',
      password: superadminPassword,
      role: 'superadmin',
      clerkUserId: 'superadmin@kpt.com',
      profileImage: 'https://via.placeholder.com/80',
      is_verified: true
    });
    await superadmin.save();
    console.log(' SuperAdmin user created: superadmin@kpt.com / SuperAdmin@123');

    // Create Admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@kpt.com',
      password: adminPassword,
      role: 'admin',
      clerkUserId: 'admin@kpt.com',
      profileImage: 'https://via.placeholder.com/80',
      is_verified: true
    });
    await admin.save();
    console.log(' Admin user created: admin@kpt.com / Admin@123');

    // Create Creator
    const creator = new User({
      name: 'Creator User',
      email: 'creator@kpt.com',
      password: creatorPassword,
      role: 'creator',
      clerkUserId: 'creator@kpt.com',
      profileImage: 'https://via.placeholder.com/80',
      is_verified: true
    });
    await creator.save();
    console.log(' Creator user created: creator@kpt.com / Creator@123');

    console.log('\n All admin users created successfully!');
    console.log('\n Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' SuperAdmin: superadmin@kpt.com / SuperAdmin@123');
    console.log(' Admin:      admin@kpt.com / Admin@123');
    console.log(' Creator:    creator@kpt.com / Creator@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error(' Error creating admin users:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedAdmin();