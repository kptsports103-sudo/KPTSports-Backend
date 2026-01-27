const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to the test database
const testDbUri = process.env.MONGO_URI.replace(/\/$/, '') + '/test';

mongoose.connect(testDbUri)
  .then(async () => {
    console.log('=== UPDATING ALL USER PASSWORDS ===');
    
    const User = require('./src/models/user.model');
    const newPassword = 'admin123';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update all users' passwords
    const result = await User.updateMany(
      {},
      { password: hashedPassword }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} user passwords`);
    console.log('New password for all users:', newPassword);
    
    // Show updated users
    const users = await User.find({}, 'email role name');
    console.log('\nUpdated users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.name}`);
    });
    
    console.log('\n🔑 Login Credentials:');
    console.log('Password for all accounts: admin123');
    console.log('\nAvailable accounts:');
    console.log('1. yashawanthareddyd@gmail.com (superadmin) - Yashawantha');
    console.log('2. kptsports103@gmail.com (creator) - KPT Sports');
    console.log('3. yashawanthareddy@gmail.com (admin) - D Yashawantha Reddy');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
