const express = require('express');
const router = express.Router();

// Basic auth route
router.get('/', (req, res) => {
  res.json({ message: 'Auth route working!' });
});

// Login route
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  
  console.log('Login attempt:', { email, role, hasPassword: !!password });
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email and password are required' 
    });
  }
  
  // For now, return a mock success (you'll implement real auth later)
  res.json({
    message: 'Login successful',
    user: {
      id: 'mock-user-id',
      email,
      role: role || 'creator',
      name: 'Mock User'
    },
    token: 'mock-jwt-token'
  });
});

// Registration route
router.post('/register', (req, res) => {
  const { email, password, role } = req.body;
  
  console.log('Registration attempt:', { email, role, hasPassword: !!password });
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email and password are required' 
    });
  }
  
  // For now, return a mock success
  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: 'mock-new-user-id',
      email,
      role: role || 'creator',
      name: 'New User'
    }
  });
});

module.exports = router;
