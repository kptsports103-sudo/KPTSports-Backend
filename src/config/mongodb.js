const mongoose = require('mongoose');

// Cache connection in global for serverless environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectMongoDB = async () => {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kpt_sports';
    
    console.log('🔄 Establishing new MongoDB connection...');
    
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false, // Prevent buffering errors
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      // Try local fallback
      try {
        const fallbackUri = 'mongodb://127.0.0.1:27017/kpt_sports';
        console.log('🔄 Trying fallback to local MongoDB...');
        return mongoose.connect(fallbackUri, {
          bufferCommands: false,
        }).then((mongoose) => {
          console.log(`✅ Fallback MongoDB Connected: ${mongoose.connection.host}`);
          return mongoose;
        });
      } catch (localError) {
        console.error('❌ Local MongoDB also failed:', localError);
        throw localError;
      }
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset promise on failure
    throw error;
  }
};

// Disable buffering globally
mongoose.set('bufferCommands', false);

module.exports = { connectMongoDB, mongoose };