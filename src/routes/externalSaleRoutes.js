const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getExternalSales,
  getExternalSaleSummary,
  createExternalSale,
  updateExternalSale,
  deleteExternalSale
} = require('../controllers/externalSaleController');

// Tum route'lar admin-only
router.use(protect);
router.use(admin);

router.get('/', getExternalSales);
router.get('/summary', getExternalSaleSummary);
router.post('/', createExternalSale);
router.put('/:id', updateExternalSale);
router.delete('/:id', deleteExternalSale);

module.exports = router;
