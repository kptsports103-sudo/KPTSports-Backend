const Home = require('../models/home.model');
const Player = require('../models/player.model');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const mongoose = require('mongoose');

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
    const { 
      heroTitle, 
      heroSubtitle, 
      heroButtons, 
      banners, 
      achievements, 
      sportsCategories, 
      gallery, 
      upcomingEvents, 
      clubs, 
      announcements,
      welcomeText, 
      highlights, 
      about, 
      history, 
      bannerImages, 
      boxes, 
      bigHeader, 
      bigText 
    } = req.body;
    
    console.log('Received update data:', req.body);
    
    let home = await Home.findOne();
    if (!home) {
      home = new Home();
    }

    // Update new CMS fields
    if (heroTitle !== undefined) home.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) home.heroSubtitle = heroSubtitle;
    if (heroButtons !== undefined) home.heroButtons = heroButtons;
    if (banners !== undefined) home.banners = banners;
    if (achievements !== undefined) home.achievements = achievements;
    if (sportsCategories !== undefined) home.sportsCategories = sportsCategories;
    if (gallery !== undefined) home.gallery = gallery;
    if (upcomingEvents !== undefined) home.upcomingEvents = upcomingEvents;
    if (clubs !== undefined) home.clubs = clubs;
    if (announcements !== undefined) home.announcements = announcements;

    // Update legacy fields
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
      id: p.playerId || String(p._id),
      masterId: p.masterId || '',
      name: p.name,
      branch: p.branch,
      diplomaYear: p.currentDiplomaYear || p.baseDiplomaYear || null,
      semester: p.semester || '1',
      kpmNo: p.kpmNo || ''
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
        id: player.playerId || String(player._id),
        masterId: player.masterId || '',
        name: player.name,
        branch: player.branch,
        diplomaYear: player.currentDiplomaYear || player.baseDiplomaYear || null,
        semester: player.semester || '1',
        kpmNo: player.kpmNo || ''
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
    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Invalid payload. Expected data: [{ year, players: [] }].' });
    }

    const coachId = req.user?.id;
    if (!coachId || !mongoose.Types.ObjectId.isValid(coachId)) {
      return res.status(401).json({ message: 'Invalid authentication user.' });
    }

    // Build and validate docs before deleting current data.
    const docs = [];
    for (const yearData of data) {
      const year = Number(yearData?.year);
      if (!year || !Array.isArray(yearData?.players)) continue;

      for (const player of yearData.players) {
        const name = (player?.name || '').trim();
        const branch = (player?.branch || '').trim();
        if (!name || !branch) continue;

        const parsedDiplomaYear = Number(player?.diplomaYear);
        const safeDiplomaYear = [1, 2, 3].includes(parsedDiplomaYear) ? parsedDiplomaYear : 1;
        const parsedSemester = String(player?.semester || '1').trim();
        const safeSemester = ['1', '2', '3', '4', '5', '6'].includes(parsedSemester) ? parsedSemester : '1';
        const safeKpmNo = String(player?.kpmNo || '').trim();
        const safeMasterId = String(player?.masterId || new mongoose.Types.ObjectId()).trim();
        const playerId = String(player?.id || player?.playerId || new mongoose.Types.ObjectId());

        docs.push({
          name,
          playerId,
          masterId: safeMasterId,
          branch,
          kpmNo: safeKpmNo,
          firstParticipationYear: year,
          baseDiplomaYear: safeDiplomaYear,
          currentDiplomaYear: safeDiplomaYear,
          semester: safeSemester,
          year,
          coachId
        });
      }
    }

    if (docs.length === 0) {
      return res.status(400).json({ message: 'No valid players to save.' });
    }

    // Clear existing and save new set.
    await Player.deleteMany({});
    await Player.insertMany(docs);
    res.json({ message: 'Players saved successfully' });
  } catch (error) {
    console.error('Error saving players:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
