const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const homeRoutes = require('./src/routes/home.routes');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://kpt-sports.vercel.app',
    'https://kpt-sports-backend.vercel.app'
  ],
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