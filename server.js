require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const eventRoutes = require('./routes/events');
const errorHandler = require('./middleware/errorHandler');

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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

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

// Error handler
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
