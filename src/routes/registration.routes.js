const express = require('express');
const { getRegistrations, createRegistration } = require('../controllers/registration.controller');

const router = express.Router();

router.get('/', getRegistrations);
router.post('/', createRegistration);

module.exports = router;
