const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./src/models/user.model');
    
    console.log('=== PASSWORD RESET ===');
    
    const email = 'yashawanthareddy@gmail.com';
    const newPassword = 'admin123'; // Setting a known password
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const result = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: hashedPassword },
      { new: true }
    );
    
    if (result) {
      console.log('✅ Password updated successfully!');
      console.log('Email:', result.email);
      console.log('Role:', result.role);
      console.log('New password:', newPassword);
      
      // Test the new password
      const isMatch = await bcrypt.compare(newPassword, result.password);
      console.log('Password test:', isMatch ? '✅ WORKS' : '❌ FAILED');
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
