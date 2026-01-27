const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the test database
const testDbUri = process.env.MONGO_URI.replace(/\/$/, '') + '/test';

mongoose.connect(testDbUri)
  .then(async () => {
    console.log('=== CHECKING OTP FOR PHONE 8073053195 ===');
    
    const User = require('./src/models/user.model');
    
    // Find user with phone number 8073053195
    const user = await User.findOne({ phone: '8073053195' });
    
    if (user) {
      console.log('User found:');
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Role:', user.role);
      console.log('- Phone:', user.phone);
      console.log('- OTP:', user.otp);
      console.log('- OTP Expires:', user.otp_expires_at);
      console.log('- Is Verified:', user.is_verified);
      
      if (user.otp) {
        console.log('\n🔑 USE THIS OTP FOR VERIFICATION:', user.otp);
        console.log('This OTP will expire at:', user.otp_expires_at);
      } else {
        console.log('\n❌ No OTP found for this user');
        console.log('The user might already be verified or OTP expired');
      }
    } else {
      console.log('❌ No user found with phone number 8073053195');
      
      // Show all users with their phone numbers
      console.log('\nAll users in database:');
      const allUsers = await User.find({}, 'email name phone');
      allUsers.forEach(u => {
        console.log(`- ${u.email} - ${u.name} - Phone: ${u.phone || 'Not set'}`);
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
