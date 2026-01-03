const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.get('/', eventController.getEvents);
router.post('/', authMiddleware, roleMiddleware(['admin']), eventController.createEvent);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), eventController.updateEvent);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), eventController.deleteEvent);

module.exports = router;