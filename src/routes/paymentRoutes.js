const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  initializeCheckoutForm,
  checkoutFormCallback,
  getPaymentStatus
} = require('../controllers/paymentController');

// Checkout form başlat (kullanıcı girişi gerekli)
router.post('/initialize', protect, initializeCheckoutForm);

// iyzico callback (public - iyzico tarafından çağrılır)
router.post('/callback', checkoutFormCallback);

// Ödeme durumu sorgula (kullanıcı girişi gerekli)
router.get('/status/:orderNumber', protect, getPaymentStatus);

module.exports = router;
