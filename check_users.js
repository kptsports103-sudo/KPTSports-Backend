const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./src/models/user.model');
    const count = await User.countDocuments();
    console.log('Total user accounts:', count);
    
    const users = await User.find({}, 'email role is_verified');
    console.log('\nUser breakdown:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Verified: ${user.is_verified}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
