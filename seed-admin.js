require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hashedPassword = await bcrypt.hash('@Admin#KPT!103$', 10);

    // Delete any existing users with this email first
    await User.deleteMany({ email: 'yashwanthareddyd@gmail.com' });
    console.log('Deleted existing users with email yashwanthareddyd@gmail.com');

    // Create Admin
    const admin = new User({
      name: 'D yashawantha Reddy',
      email: 'yashwanthareddyd@gmail.com',
      password: hashedPassword,
      role: 'admin',
      clerkUserId: 'yashwanthareddyd@gmail.com',
      profileImage: 'https://via.placeholder.com/80'
    });
    await admin.save();
    console.log('Admin user created successfully');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedAdmin();