require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { connectMongoDB } = require('./config/mongodb');

// Routes
const authRoutes = require('./routes/auth.routes');
const iamRoutes = require('./routes/iam.routes');
const homeRoutes = require('./routes/home.routes');
const meRoutes = require('./routes/me.routes');
const eventRoutes = require('./routes/event.routes');
const galleryRoutes = require('./routes/gallery.routes');
const resultRoutes = require('./routes/result.routes');
const groupResultRoutes = require('./routes/groupResult.routes');
const uploadRoutes = require('./routes/upload.routes');

const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Database readiness state
let dbReady = false;

// Initialize database connection
(async () => {
  try {
    await connectMongoDB();
    dbReady = true;
    console.log('✅ Database ready for requests');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    // Don't set dbReady = true, will keep returning 503
  }
})();

/* ------------- Middleware ------------ */
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database readiness guard middleware
app.use((req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Database initializing, please retry shortly',
      retryAfter: 5
    });
  }
  next();
});

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://kpt-sports-frontend.vercel.app',
    ],
    credentials: true,
  })
);

/* ---------------- Health ------------- */
// Suppress favicon 404s
app.get('/favicon.ico', (_, res) => res.status(204).end());
app.get('/favicon.png', (_, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.json({ message: 'KPT Sports Backend API running 🚀' });
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

/* -------------- API Routes ----------- */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/iam', iamRoutes);
app.use('/api/v1/home', homeRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/galleries', galleryRoutes);
app.use('/api/v1/results', resultRoutes);
app.use('/api/v1/group-results', groupResultRoutes);
app.use('/api/v1/upload', uploadRoutes);

/* -------------- Errors --------------- */
app.use(errorMiddleware);

module.exports = app;