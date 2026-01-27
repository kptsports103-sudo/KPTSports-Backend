const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./src/models/user.model');
    
    console.log('=== TESTING LOGIN PROCESS ===');
    
    // Test the exact credentials from frontend
    const email = 'yashawanthareddy@gmail.com';
    const role = 'admin';
    const password = 'password'; // We need to know what password you're using
    
    console.log('\n1. Looking for user with email:', email, 'and role:', role);
    
    // Find user by email first
    let user = await User.findOne({ email: email.toLowerCase() });
    console.log('User found by email:', !!user);
    
    if (user) {
      console.log('User details:');
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- ID:', user._id);
      console.log('- Verified:', user.is_verified);
      console.log('- Password hash exists:', !!user.password);
      console.log('- Password hash length:', user.password ? user.password.length : 0);
      
      // Test password comparison with common passwords
      const testPasswords = ['password', 'admin', '123456', 'Password123'];
      
      console.log('\n2. Testing password comparison:');
      for (const testPwd of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPwd, user.password);
          console.log(`- "${testPwd}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        } catch (err) {
          console.log(`- "${testPwd}": ❌ ERROR - ${err.message}`);
        }
      }
      
      // Test role comparison
      console.log('\n3. Testing role comparison:');
      console.log('User role (lowercase):', user.role.toLowerCase());
      console.log('Requested role (lowercase):', role.toLowerCase());
      console.log('Role match:', user.role.toLowerCase() === role.toLowerCase());
      
    } else {
      console.log('❌ USER NOT FOUND');
      
      // Show all users for debugging
      console.log('\nAll users in database:');
      const allUsers = await User.find({}, 'email role');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.role})`);
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
