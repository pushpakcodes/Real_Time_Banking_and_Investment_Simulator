const express = require('express');
const router = express.Router();
const {
  createBankAccount,
  getBankAccounts,
  depositMoney,
  withdrawMoney,
  transferMoney,
  getTransactions
} = require('../controllers/bankController');
const { protect } = require('../middleware/authMiddleware');

router.post('/accounts', protect, createBankAccount);
router.get('/accounts', protect, getBankAccounts);
router.post('/deposit', protect, depositMoney);
router.post('/withdraw', protect, withdrawMoney);
router.post('/transfer', protect, transferMoney);
router.get('/accounts/:id/transactions', protect, getTransactions);

module.exports = router;
