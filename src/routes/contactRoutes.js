const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { protect, admin } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage
} = require('../controllers/contactController');

// Mesaj gönderme validasyonu
const contactValidation = [
  body('name').trim().notEmpty().withMessage('Ad soyad gereklidir'),
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
  body('subject').trim().notEmpty().withMessage('Konu gereklidir'),
  body('message').trim().notEmpty().withMessage('Mesaj gereklidir'),
  validate
];

// Public
router.post('/', contactValidation, sendMessage);

// Admin
router.get('/', protect, admin, getMessages);
router.put('/:id/read', protect, admin, markAsRead);
router.delete('/:id', protect, admin, deleteMessage);

module.exports = router;
