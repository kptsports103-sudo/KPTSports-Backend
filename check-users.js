const mongoose = require('mongoose');
const User = require('./src/models/user.model');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({ role: { $in: ['creator', 'admin', 'superadmin'] } });
  console.log('Available admin users:');
  users.forEach(user => {
    console.log(`Email: ${user.email}, Role: ${user.role}, Name: ${user.name}`);
  });
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
