const express = require('express');
const cors = require('cors');

const app = express();

// CORS first
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email);
  
  res.json({
    message: 'Login successful',
    user: { id: '1', email, name: 'Test User' },
    token: 'mock-token'
  });
});

app.get('/api/auth', (req, res) => {
  res.json({ message: 'Auth route working' });
});

module.exports = app;