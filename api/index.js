const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const homeRoutes = require('./src/routes/home.routes');

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

// CORS MUST be first - use wildcard for testing
app.use(cors({
  origin: '*', // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicit preflight handling
app.options('*', cors());

app.use(cookieParser());
app.use(express.json());

// Basic routes
app.get('/api/home', (req, res) => {
  res.json({ ok: true, message: 'Backend is working!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (matching your frontend calls)
app.use('/api/auth', authRoutes);
app.use('/api/v1/home', homeRoutes);

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