const Home = require('../models/home.model');
const Player = require('../models/player.model');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadBanner = [
  upload.single('banner'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const result = await cloudinary.uploader.upload(req.file.buffer, {
        folder: 'banners',
        resource_type: 'image'
      });
      res.json({ url: result.secure_url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Upload failed' });
    }
  }
];

exports.getHome = async (req, res) => {
  try {
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
      await home.save();
    }
    res.json(home);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateHome = async (req, res) => {
  try {
    const { welcomeText, banners, highlights, about, history, bannerImages, boxes, bigHeader, bigText } = req.body;
    console.log('Received update data:', req.body);
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
    }
    // Update existing fields
    if (welcomeText !== undefined) home.welcomeText = welcomeText;
    if (banners !== undefined) home.banners = banners;
    if (highlights !== undefined) {
      // Handle migration from string array to object array
      if (Array.isArray(highlights) && highlights.length > 0) {
        // Check if first element is a string (old format)
        if (typeof highlights[0] === 'string') {
          // Convert strings to objects
          home.highlights = highlights.map(str => ({
            title: str,
            overview: '',
            url: '',
            urlFixed: false
          }));
        } else {
          // Already in object format
          home.highlights = highlights;
        }
      } else {
        home.highlights = highlights;
      }
    }
    if (about !== undefined) home.about = about;
    if (history !== undefined) home.history = history;
    // Update About page fields
    if (bannerImages !== undefined) home.bannerImages = bannerImages;
    if (boxes !== undefined) home.boxes = boxes;
    if (bigHeader !== undefined) home.bigHeader = bigHeader;
    if (bigText !== undefined) home.bigText = bigText;
    try {
      await home.save();
      console.log('Home updated successfully');
      res.json(home);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      // If validation fails, try to save without highlights
      if (validationError.name === 'ValidationError') {
        console.log('Validation failed, trying to save without highlights...');
        home.highlights = []; // Clear highlights to avoid validation issues
        await home.save();
        console.log('Home saved without highlights');
        res.json(home);
      } else {
        throw validationError;
      }
    }
  } catch (error) {
    console.error('Error updating home:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAboutTimeline = async (req, res) => {
  try {
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
      await home.save();
    }
    res.json({ timeline: home.timeline || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAboutTimeline = async (req, res) => {
  try {
    const { timeline } = req.body;
    console.log('Received timeline update:', timeline);
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
    }
    home.timeline = timeline;
    await home.save();
    console.log('Timeline updated successfully');
    res.json({ message: 'Timeline updated successfully' });
  } catch (error) {
    console.error('Error updating timeline:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudentParticipation = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    // Fetch players from database for the year
    const players = await Player.find({ year: targetYear }).sort({ createdAt: -1 });

    const students = players.map(p => ({
      id: p._id,
      name: p.name,
      branch: p.branch,
      diplomaYear: p.diplomaYear
    }));

    res.json({
      year: targetYear,
      students
    });
  } catch (error) {
    console.error('Error fetching student participation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPlayers = async (req, res) => {
  try {
    const players = await Player.find({}).sort({ year: -1, createdAt: -1 });
    const grouped = players.reduce((acc, player) => {
      if (!acc[player.year]) acc[player.year] = [];
      acc[player.year].push({
        id: player._id,
        name: player.name,
        branch: player.branch,
        diplomaYear: player.diplomaYear
      });
      return acc;
    }, {});
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.savePlayers = async (req, res) => {
  try {
    const { data } = req.body; // data is array of {year, players: []}
    // Clear existing and save new
    await Player.deleteMany({});
    for (const yearData of data) {
      for (const player of yearData.players) {
        await Player.create({
          name: player.name,
          branch: player.branch,
          diplomaYear: player.diplomaYear,
          year: yearData.year,
          coachId: req.user?.id || 'default' // assuming auth
        });
      }
    }
    res.json({ message: 'Players saved successfully' });
  } catch (error) {
    console.error('Error saving players:', error);
    res.status(500).json({ message: 'Server error' });
  }
};