require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../config/db');
const authRoutes = require('../routes/auth');
const pageRoutes = require('../routes/pages');
const eventRoutes = require('../routes/events');
const homeRoutes = require('../src/routes/home.routes');
const errorHandler = require('../middleware/errorHandler');

const app = express();

// Connect MongoDB
connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kpt_sports');

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://kpt-sports.vercel.app',
      'https://kpt-sports-backend.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Handle preflight requests
app.options('*', cors());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'KPT Sports Backend API is running 🚀',
    version: 'v1',
    endpoints: {
      health: '/healthz',
      auth: '/api/v1/auth',
      pages: '/api/v1/pages',
      events: '/api/v1/events',
      home: '/api/v1/home'
    }
  });
});

// Test route
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kpt-sports-backend',
    time: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pages', pageRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/home', homeRoutes);

// Error handler
app.use(errorHandler);

// DO NOT use app.listen() for Vercel
module.exports = app;