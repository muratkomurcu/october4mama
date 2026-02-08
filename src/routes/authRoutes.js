const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Kayıt validasyonu
const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Ad soyad gereklidir'),
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
  body('phone').trim().notEmpty().withMessage('Telefon numarası gereklidir'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  body('address').trim().notEmpty().withMessage('Adres gereklidir'),
  body('petType')
    .isIn(['köpek', 'kedi'])
    .withMessage('Hayvan türü köpek veya kedi olmalıdır'),
  body('petName').trim().notEmpty().withMessage('Hayvanın ismi gereklidir'),
  body('petBreed').trim().notEmpty().withMessage('Hayvanın ırkı gereklidir'),
  body('petWeight')
    .isFloat({ min: 0.5, max: 100 })
    .withMessage('Kilo 0.5 ile 100 kg arasında olmalıdır'),
  body('petAge')
    .isFloat({ min: 0, max: 30 })
    .withMessage('Yaş 0 ile 30 arasında olmalıdır'),
  validate
];

// Giriş validasyonu
const loginValidation = [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
  body('password').notEmpty().withMessage('Şifre gereklidir'),
  validate
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

module.exports = router;
