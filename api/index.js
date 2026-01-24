const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for now
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