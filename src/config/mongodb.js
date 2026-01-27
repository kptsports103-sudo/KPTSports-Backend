const mongoose = require('mongoose');

// Cache connection in global for serverless environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Disable buffering globally to prevent timeout errors
mongoose.set('bufferCommands', false);

const connectMongoDB = async () => {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = process.env.MONGO_URI.replace(/\/$/, '') + '/test';
    
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is required');
    }
    
    console.log('🔄 Establishing new MongoDB connection...');
    
    cached.promise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    }).then((mongoose) => {
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      // Reset promise on failure to allow retry
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = { connectMongoDB };