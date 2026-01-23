require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const iamRoutes = require('./routes/iam.routes');
const homeRoutes = require('./routes/home.routes');
const meRoutes = require('./routes/me.routes');
const eventRoutes = require('./routes/event.routes');
const galleryRoutes = require('./routes/gallery.routes');
const resultRoutes = require('./routes/result.routes');
const groupResultRoutes = require('./routes/groupResult.routes');
const uploadRoutes = require('./routes/upload.routes');
const authMiddleware = require('./middlewares/auth.middleware');
const Home = require('./models/home.model');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Connect to MongoDB
const { connectMongoDB, mongoose } = require('./config/mongodb');
connectMongoDB().catch(err => {
  console.error('MongoDB connection failed, using local fallback');
  // Fallback to local
  mongoose.connect('mongodb://127.0.0.1:27017/kpt_sports').then(() => {
    console.log('✅ Connected to local MongoDB');
  }).catch(err => {
    console.error('❌ Local MongoDB also failed:', err);
  });
});

// Drop old email index if exists
const User = require('./models/user.model');
User.collection.dropIndex('email_1').catch(err => {
  if (err.code !== 27) { // 27 is index not found
    console.error('Error dropping old index:', err);
  }
});

// Additional routes
app.get('/api/about', async (req, res) => {
  try {
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
      await home.save();
    }
    res.json({ content: home.about });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/about', async (req, res) => {
  try {
    const { content } = req.body;
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
    }
    home.about = content;
    await home.save();
    res.json({ message: 'About updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
      await home.save();
    }
    res.json({ content: home.history });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/history', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
    }
    home.history = content;
    await home.save();
    res.json({ message: 'History updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://kpt-sports-frontend.vercel.app'], // Allow frontend origins
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/iam', iamRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/me', meRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/galleries', galleryRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/group-results', groupResultRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(errorMiddleware);

module.exports = app;