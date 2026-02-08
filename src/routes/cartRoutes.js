const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart
} = require('../controllers/cartController');

// Tüm route'lar protected (giriş gerektirir)
router.use(protect);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/sync', syncCart);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
