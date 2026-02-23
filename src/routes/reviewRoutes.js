const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getProductReviews,
  createReview,
  deleteReview
} = require('../controllers/reviewController');

// GET /api/reviews/:productId  → public
router.get('/:productId', getProductReviews);

// POST /api/reviews/:productId  → giriş yapmış kullanıcı
router.post('/:productId', protect, createReview);

// DELETE /api/reviews/:reviewId  → admin
router.delete('/:reviewId', protect, admin, deleteReview);

module.exports = router;
