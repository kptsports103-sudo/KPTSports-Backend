const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import only auth routes (working)
const authRoutes = require('./routes/auth');

const app = express();

// Manual CORS middleware (backup)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// CORS middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

// Basic routes
app.get('/api/home', (req, res) => {
  res.json({ ok: true, message: 'Backend is working!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (only auth for now)
app.use('/api/auth', authRoutes);

// Mock home route to avoid crashes
app.get('/api/v1/home', (req, res) => {
  res.json({ message: 'Home route working!' });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'KPT Sports Backend API is running 🚀',
    version: 'v1',
    endpoints: {
      health: '/health',
      home: '/api/home',
      auth: '/api/auth',
      home_v1: '/api/v1/home'
    }
  });
});

module.exports = app;