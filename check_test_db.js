const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the 'test' database specifically
const testDbUri = process.env.MONGO_URI.replace(/\/$/, '') + '/test';

mongoose.connect(testDbUri)
  .then(async () => {
    console.log('Connected to test database');
    
    // Check if users collection exists and get data
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in test database:', collections.map(c => c.name));
    
    if (collections.find(c => c.name === 'users')) {
      const User = require('./src/models/user.model');
      const count = await User.countDocuments();
      console.log('\nTotal users in test database:', count);
      
      const users = await User.find({}, 'email role is_verified name phone');
      console.log('\nUsers in test database:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - ${user.name} - Verified: ${user.is_verified}`);
      });
    } else {
      console.log('No users collection found in test database');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
