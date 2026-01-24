const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

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

app.get('/api/home', (req, res) => {
  res.json({ ok: true, message: 'Backend is working!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;