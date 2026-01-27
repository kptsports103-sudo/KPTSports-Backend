const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to the test database
const testDbUri = process.env.MONGO_URI.replace(/\/$/, '') + '/test';

mongoose.connect(testDbUri)
  .then(async () => {
    console.log('=== TESTING COMMON PASSWORDS ===');
    
    const User = require('./src/models/user.model');
    const users = await User.find({}, 'email role password');
    
    // Test common passwords that might have been used
    const commonPasswords = [
      'password', 'admin', '123456', 'Password123', 'admin123',
      'kpt', 'kpt123', 'sports', 'kptsports', 'yashu', 'yashu123',
      'test', 'test123', 'user', 'user123'
    ];
    
    for (const user of users) {
      console.log(`\nTesting passwords for: ${user.email} (${user.role})`);
      
      for (const password of commonPasswords) {
        try {
          const isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) {
            console.log(`✅ FOUND PASSWORD: "${password}"`);
            break;
          }
        } catch (err) {
          // Skip invalid passwords
        }
      }
    }
    
    console.log('\nIf no passwords were found above, you need to:');
    console.log('1. Provide the original passwords that were used to create these accounts');
    console.log('2. Or tell me to reset them to specific passwords you want to use');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
