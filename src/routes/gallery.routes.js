const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.get('/', galleryController.getGalleries);
router.post('/', authMiddleware, roleMiddleware(['admin']), galleryController.createGallery);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), galleryController.updateGallery);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), galleryController.deleteGallery);

module.exports = router;