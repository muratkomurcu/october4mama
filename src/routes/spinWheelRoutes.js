const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getStatus, spin } = require('../controllers/spinWheelController');

router.get('/status', protect, getStatus);
router.post('/spin', protect, spin);

module.exports = router;
