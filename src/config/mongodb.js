const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kpt_sports');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Try local fallback
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/kpt_sports');
      console.log(`✅ Fallback to local MongoDB: ${conn.connection.host}`);
    } catch (localError) {
      console.error('❌ Local MongoDB also failed:', localError);
      // Don't exit, continue without DB
    }
  }
};

module.exports = { connectMongoDB, mongoose };