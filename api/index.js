const app = require('../src/app');

console.log('[DEBUG] api/index.js - Module loaded successfully');
console.log('[DEBUG] app type:', typeof app);
console.log('[DEBUG] Is app a function?', typeof app === 'function');

// NOTE: app.listen() is REMOVED for Vercel serverless compatibility
// Vercel serverless functions export the Express app directly
// The previous app.listen() would BLOCK Vercel's serverless execution
// because there's no persistent HTTP server in serverless environments

// For local development, use: npm run dev

// Export for Vercel serverless
module.exports = app;