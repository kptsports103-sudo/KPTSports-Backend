const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.get('/', eventController.getEvents);
router.post('/', authMiddleware, roleMiddleware(['creator']), eventController.createEvent);
router.put('/:id', authMiddleware, roleMiddleware(['creator']), eventController.updateEvent);
router.delete('/:id', authMiddleware, roleMiddleware(['creator']), eventController.deleteEvent);

module.exports = router;
