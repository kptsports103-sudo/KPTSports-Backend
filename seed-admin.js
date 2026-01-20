require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hashedPassword = await bcrypt.hash('@SuperAdmin#KPT!103$', 10);

    // Delete any existing users with this email first
    await User.deleteMany({ email: 'yashawanthareddyd@gmail.com' });
    console.log('Deleted existing users with email yashawanthareddyd@gmail.com');

    // Create Super Admin
    const superAdmin = new User({
      name: 'Super Admin User',
      email: 'yashawanthareddyd@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
      clerkUserId: 'yashawanthareddyd@gmail.com'
    });
    await superAdmin.save();
    console.log('Super Admin user created successfully');

    // Also create/update regular Admin
    let admin = await User.findOne({ email: 'yashawanthareddyd@gmail.com', role: 'admin' });
    if (admin) {
      admin.password = hashedPassword;
      if (!admin.name) admin.name = 'Admin User';
      await admin.save();
      console.log('Admin user password updated successfully');
    } else {
      admin = new User({
        name: 'Admin User',
        email: 'yashawanthareddyd@gmail.com',
        password: hashedPassword,
        role: 'admin',
        clerkUserId: 'yashawanthareddyd@gmail.com'
      });
      await admin.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedAdmin();