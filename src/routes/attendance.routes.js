const express = require('express');
const { getAttendances, saveAttendance } = require('../controllers/attendance.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', auth, getAttendances);
router.post('/', auth, saveAttendance);

module.exports = router;