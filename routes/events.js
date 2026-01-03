const express = require('express');
const { getEvents, createEvent, updateEvent, deleteEvent, saveEventsBulk } = require('../src/controllers/event.controller');
const auth = require('../src/middlewares/auth.middleware');

const router = express.Router();

router.get('/', getEvents);
router.post('/', auth, createEvent);
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);
router.post('/bulk', auth, saveEventsBulk);

module.exports = router;
