const express = require('express');
const router = express.Router();
const { optionalAuth, protect, admin } = require('../middleware/auth');
const {
  initializeCheckoutForm,
  checkoutFormCallback,
  getPaymentStatus,
  verifyPaymentFromIyzico
} = require('../controllers/paymentController');

// Checkout form başlat (üye veya misafir)
router.post('/initialize', optionalAuth, initializeCheckoutForm);

// iyzico callback (public - iyzico tarafından çağrılır)
router.post('/callback', checkoutFormCallback);

// Ödeme durumu sorgula (kullanıcı girişi gerekli)
router.get('/status/:orderNumber', protect, getPaymentStatus);

// Admin: iyzico'dan ödeme doğrula (bekleyen siparişleri kurtarmak için)
router.post('/verify/:orderId', protect, admin, verifyPaymentFromIyzico);

module.exports = router;
