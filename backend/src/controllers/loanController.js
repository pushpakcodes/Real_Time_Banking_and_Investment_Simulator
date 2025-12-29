const Loan = require('../models/Loan');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const LOAN_RATES = {
  PERSONAL: 12,
  HOME: 8,
  EDUCATION: 10
};

// @desc    Apply for a loan
// @route   POST /api/loans/apply
// @access  Private
const applyLoan = async (req, res) => {
  const { type, amount, tenureMonths, accountId } = req.body;

  if (amount <= 0) return res.status(400).json({ message: 'Amount must be positive' });
  if (!LOAN_RATES[type]) return res.status(400).json({ message: 'Invalid loan type' });

  // NOTE: MongoDB transactions only work on replica sets.
  // Running sequentially for local dev environment.
  
  try {
    const account = await BankAccount.findOne({ _id: accountId, user: req.user._id });
    if (!account) throw new Error('Account not found');

    const rate = LOAN_RATES[type];
    const monthlyRate = rate / 12 / 100;
    
    // EMI Calculation
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    const loan = await Loan.create({
      user: req.user._id,
      type,
      principal: amount,
      interestRate: rate,
      tenureMonths,
      startDate: req.user.simulationDate || Date.now(),
      remainingBalance: amount,
      emiAmount: emi
    });

    // Credit loan amount to account
    account.balance += Number(amount);
    await account.save();

    // Log Transaction
    await Transaction.create({
      user: req.user._id,
      account: account._id,
      type: 'LOAN_DISBURSAL',
      amount: amount,
      description: `${type} Loan Disbursal`,
      date: req.user.simulationDate || Date.now()
    });

    res.status(201).json(loan);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user loans
// @route   GET /api/loans
// @access  Private
const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user._id });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyLoan, getLoans };
