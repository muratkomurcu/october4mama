const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { uploadImage, deleteImage } = require('../controllers/uploadController');

// Resim yükle (Admin only)
router.post('/', protect, admin, upload.single('image'), uploadImage);

// Resim sil (Admin only)
router.delete('/:public_id', protect, admin, deleteImage);

module.exports = router;
