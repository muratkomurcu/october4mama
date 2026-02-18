const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');

router.use(protect);
router.use(admin);

router.get('/', getExpenses);
router.get('/summary', getExpenseSummary);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
