const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  getPendingOrders,
  updateOrderStatus
} = require('../controllers/orderController');

// Kullanıcı route'ları
router.use(protect);
router.post('/', createOrder);
router.get('/', getMyOrders);

// Admin route'ları (parametreli route'lardan ÖNCE tanımlanmalı)
router.get('/admin/all', admin, getAllOrders);
router.get('/admin/pending', admin, getPendingOrders);
router.put('/:id/status', admin, updateOrderStatus);

// Parametreli route en sona
router.get('/:id', getOrder);

module.exports = router;
