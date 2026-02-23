const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug); // slug route /:id'den ÖNCE olmalı
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
