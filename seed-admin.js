require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hashedPassword = await bcrypt.hash('corxtgoinlrixaam', 10);
    let admin = await User.findOne({ email: 'yashawanthareddyd@gmail.com', role: 'admin' });
    if (admin) {
      admin.password = hashedPassword;
      await admin.save();
      console.log('Admin user password updated successfully');
    } else {
      admin = new User({
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