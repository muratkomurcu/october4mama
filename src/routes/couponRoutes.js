const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');

// Public - kupon dogrulama (sepette kullanilir)
router.post('/validate', validateCoupon);

// Admin route'lari
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;
