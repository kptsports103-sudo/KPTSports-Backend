const express = require('express');
const { getTrainingSchedules, saveTrainingSchedules } = require('../controllers/trainingSchedule.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', auth, getTrainingSchedules);
router.post('/', auth, saveTrainingSchedules);

module.exports = router;