const express = require('express');
const router = express.Router();
const { optionalAuth, protect } = require('../middleware/auth');
const {
  initializeCheckoutForm,
  checkoutFormCallback,
  getPaymentStatus
} = require('../controllers/paymentController');

// Checkout form başlat (üye veya misafir)
router.post('/initialize', optionalAuth, initializeCheckoutForm);

// iyzico callback (public - iyzico tarafından çağrılır)
router.post('/callback', checkoutFormCallback);

// Ödeme durumu sorgula (kullanıcı girişi gerekli)
router.get('/status/:orderNumber', protect, getPaymentStatus);

module.exports = router;
