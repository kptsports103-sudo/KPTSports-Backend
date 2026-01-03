const express = require('express');
const router = express.Router();

// Mock home data (in a real app, this would be from database)
let homeData = {
  welcomeText: 'Welcome to KPT Sports',
  banners: ['banner1.jpg', 'banner2.jpg'],
  highlights: ['Achievement 1', 'Achievement 2'],
  year: '2024'
};

router.get('/home', (req, res) => {
  res.json(homeData);
});

router.put('/home', (req, res) => {
  homeData = { ...homeData, ...req.body };
  res.json({ message: 'Home content updated successfully' });
});

router.get('/', (req, res) => {
  res.json({ message: 'Pages route working!' });
});

module.exports = router;
