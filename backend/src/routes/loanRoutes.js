const express = require('express');
const router = express.Router();
const { applyLoan, getLoans } = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

router.post('/apply', protect, applyLoan);
router.get('/', protect, getLoans);

module.exports = router;
