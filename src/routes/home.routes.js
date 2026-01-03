const express = require('express');
const { getHome, updateHome, uploadBanner, getAboutTimeline, updateAboutTimeline, getStudentParticipation, getPlayers, savePlayers } = require('../controllers/home.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', getHome);
router.put('/', updateHome);
router.post('/upload-banner', auth, uploadBanner);
router.get('/about-timeline', getAboutTimeline);
router.put('/about-timeline', auth, updateAboutTimeline);
router.get('/student-participation', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, getStudentParticipation);
router.get('/players', getPlayers);
router.post('/players', auth, savePlayers);

module.exports = router;