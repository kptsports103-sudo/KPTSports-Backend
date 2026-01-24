const mongoose = require('mongoose');
const User = require('./src/models/user.model');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ email: 'kptsports103@gmail.com' });
  if (user) {
    console.log('User found:');
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`OTP: ${user.otp}`);
    console.log(`OTP Expires: ${user.otp_expires_at}`);
    console.log(`Is Expired: ${new Date(user.otp_expires_at) < new Date()}`);
  } else {
    console.log('User not found');
  }
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
