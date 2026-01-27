const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the test database
const testDbUri = process.env.MONGO_URI.replace(/\/$/, '') + '/test';

mongoose.connect(testDbUri)
  .then(async () => {
    console.log('=== CHECKING EXISTING PASSWORDS ===');
    
    const User = require('./src/models/user.model');
    const users = await User.find({}, 'email role name password');
    
    console.log('\nUsers with their password hashes:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.name}`);
      console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
      console.log(`  Hash length: ${user.password.length}`);
    });
    
    console.log('\n⚠️  Passwords are hashed in the database.');
    console.log('To test login, you need to know the original passwords that were used to create these accounts.');
    console.log('If you don\'t remember the original passwords, you may need to:');
    console.log('1. Ask the person who created these accounts for the passwords');
    console.log('2. Or reset passwords to known values for testing');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
