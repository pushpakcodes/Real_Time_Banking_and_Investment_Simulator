const FixedDeposit = require('../models/FixedDeposit');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Create Fixed Deposit
// @route   POST /api/fds/create
// @access  Private
const createFD = async (req, res) => {
  const { amount, tenureYears, accountId } = req.body;

  if (amount <= 0) return res.status(400).json({ message: 'Amount must be positive' });
  
  // NOTE: MongoDB transactions only work on replica sets.
  // Running sequentially for local dev environment.

  try {
    const account = await BankAccount.findOne({ _id: accountId, user: req.user._id });
    if (!account) throw new Error('Account not found');
    if (account.balance < amount) throw new Error('Insufficient funds');

    // Interest Rate Logic (Simple slab)
    let rate = 6.0;
    if (tenureYears >= 1) rate = 6.5;
    if (tenureYears >= 3) rate = 7.0;
    if (tenureYears >= 5) rate = 7.5;

    const startDate = new Date(req.user.simulationDate || Date.now());
    const maturityDate = new Date(startDate);
    maturityDate.setFullYear(maturityDate.getFullYear() + tenureYears);

    const fd = await FixedDeposit.create({
      user: req.user._id,
      account: account._id,
      principal: amount,
      interestRate: rate,
      startDate: startDate,
      maturityDate: maturityDate,
      compoundingFrequency: 'Quarterly',
      status: 'ACTIVE'
    });

    // Debit Account
    account.balance -= Number(amount);
    await account.save();

    // Log Transaction
    await Transaction.create({
      user: req.user._id,
      account: account._id,
      type: 'FD_CREATION',
      amount: -amount,
      description: `FD Created (Rate: ${rate}%)`,
      date: startDate
    });

    res.status(201).json(fd);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user FDs
// @route   GET /api/fds
// @access  Private
const getFDs = async (req, res) => {
  try {
    const fds = await FixedDeposit.find({ user: req.user._id });
    res.json(fds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createFD, getFDs };
