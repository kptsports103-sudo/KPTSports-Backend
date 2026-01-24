const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5176', 'http://localhost:5174', 'http://localhost:5173'],
  credentials: true
}));

// Test OTP verification endpoint
app.post('/api/v1/auth/verify-otp', express.json(), (req, res) => {
  console.log('=== TEST OTP VERIFICATION ===');
  console.log('Request body:', req.body);
  console.log('Email:', req.body.email);
  console.log('OTP:', req.body.otp);
  
  // Forward to actual backend or return test response
  res.json({ message: 'Test endpoint reached', body: req.body });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
