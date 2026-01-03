const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    files: 10 // Maximum 10 files
  }
});

router.post('/', authMiddleware, upload.array('files'), async (req, res) => {
  console.log('Upload request received, files:', req.files ? req.files.length : 0);
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(file => {
      const base64 = file.buffer.toString('base64');
      return cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64}`, {
        folder: 'media',
      });
    });

    const results = await Promise.all(uploadPromises);
    console.log('Upload results:', results.length);

    const files = results.map(result => ({
      url: result.secure_url,
      public_id: result.public_id
    }));

    res.json({ success: true, files });
  } catch (error) {
    console.error('Upload error:', error);

    // Handle specific error types
    if (error.http_code === 413) {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size allowed is 100MB'
      });
    }

    if (error.name === 'MulterError') {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum size allowed is 100MB'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 10 files allowed'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed'
    });
  }
});

router.delete('/:public_id', authMiddleware, async (req, res) => {
  try {
    const { public_id } = req.params;
    await cloudinary.uploader.destroy(public_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;