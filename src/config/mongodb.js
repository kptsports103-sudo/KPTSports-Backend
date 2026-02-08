const mongoose = require('mongoose');

// Cache connection in global for serverless environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Disable buffering globally to prevent timeout errors
mongoose.set('bufferCommands', false);

const connectMongoDB = async () => {
  console.log('[DEBUG] connectMongoDB called');
  console.log('[DEBUG] Cached connection exists?', !!cached.conn);
  console.log('[DEBUG] Cached promise exists?', !!cached.promise);
  
  if (cached.conn) {
    console.log('[DEBUG] ✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    // Check if MONGO_URI exists (mask for security)
    const mongoUriRaw = process.env.MONGO_URI || '';
    const mongoUriMasked = mongoUriRaw ? 
      mongoUriRaw.substring(0, 20) + '...' + mongoUriRaw.substring(mongoUriRaw.length - 5) : 
      'NOT SET';
    console.log('[DEBUG] MONGO_URI (masked):', mongoUriMasked);
    
    const mongoUri = mongoUriRaw.replace(/\/$/, '') + '/test';
    
    if (!mongoUriRaw) {
      console.error('[DEBUG] ❌ MONGO_URI environment variable is required');
      throw new Error('MONGO_URI environment variable is required');
    }
    
    console.log('[DEBUG] 🔄 Establishing new MongoDB connection...');
    
    cached.promise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('[DEBUG] ✅ MongoDB Connected:', mongoose.connection.host);
      return mongoose;
    }).catch((error) => {
      console.error('[DEBUG] ❌ MongoDB connection error:', error.message);
      // Reset promise on failure to allow retry
      cached.promise = null;
      throw error;
    });
  }

  console.log('[DEBUG] Awaiting cached promise...');
  cached.conn = await cached.promise;
  console.log('[DEBUG] ✅ MongoDB connection established');
  return cached.conn;
};

module.exports = { connectMongoDB };