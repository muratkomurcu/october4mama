const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  getPendingOrders,
  updateOrderStatus,
  trackOrder
} = require('../controllers/orderController');

// Public: sipariş sorgulama (giriş gerektirmez)
router.post('/track', trackOrder);

// Bundan sonraki tüm route'lar auth gerektirir
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
