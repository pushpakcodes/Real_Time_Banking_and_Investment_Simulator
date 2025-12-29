const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Create a new bank account
// @route   POST /api/bank/accounts
// @access  Private
const createBankAccount = async (req, res) => {
  const { bankName, type, initialDeposit } = req.body;

  try {
    // Generate a random 10-digit account number
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const account = await BankAccount.create({
      user: req.user._id,
      bankName,
      accountNumber,
      type,
      balance: initialDeposit || 0
    });

    if (initialDeposit > 0) {
      await Transaction.create({
        user: req.user._id,
        account: account._id,
        type: 'DEPOSIT',
        amount: initialDeposit,
        description: 'Initial Deposit',
        date: req.user.simulationDate || Date.now()
      });
    }

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all user bank accounts
// @route   GET /api/bank/accounts
// @access  Private
const getBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ user: req.user._id });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deposit money
// @route   POST /api/bank/deposit
// @access  Private
const depositMoney = async (req, res) => {
  const { accountId, amount } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be positive' });
  }

  try {
    const account = await BankAccount.findOne({ _id: accountId, user: req.user._id });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    account.balance += Number(amount);
    await account.save();

    await Transaction.create({
      user: req.user._id,
      account: account._id,
      type: 'DEPOSIT',
      amount,
      description: 'Cash Deposit',
      date: req.user.simulationDate || Date.now()
    });

    res.json({ message: 'Deposit successful', newBalance: account.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw money
// @route   POST /api/bank/withdraw
// @access  Private
const withdrawMoney = async (req, res) => {
  const { accountId, amount } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be positive' });
  }

  try {
    const account = await BankAccount.findOne({ _id: accountId, user: req.user._id });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    account.balance -= Number(amount);
    await account.save();

    await Transaction.create({
      user: req.user._id,
      account: account._id,
      type: 'WITHDRAWAL',
      amount,
      description: 'Cash Withdrawal',
      date: req.user.simulationDate || Date.now()
    });

    res.json({ message: 'Withdrawal successful', newBalance: account.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transfer money
// @route   POST /api/bank/transfer
// @access  Private
const transferMoney = async (req, res) => {
  const { fromAccountId, toAccountNumber, amount, description } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be positive' });
  }

  // NOTE: MongoDB transactions only work on replica sets. 
  // For this local simulation without a complex DB setup, we'll run operations sequentially.
  // This is less atomic but functional for a dev environment.
  
  try {
    const fromAccount = await BankAccount.findOne({ _id: fromAccountId, user: req.user._id });
    if (!fromAccount) {
      throw new Error('Source account not found');
    }

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient funds');
    }

    const toAccount = await BankAccount.findOne({ accountNumber: toAccountNumber });
    if (!toAccount) {
      throw new Error('Destination account not found');
    }

    // Deduct from source
    fromAccount.balance -= Number(amount);
    await fromAccount.save();

    // Add to destination
    toAccount.balance += Number(amount);
    await toAccount.save();

    // Log transaction for sender
    await Transaction.create({
      user: req.user._id,
      account: fromAccount._id,
      type: 'TRANSFER',
      amount: -amount,
      description: `Transfer to ${toAccount.bankName} (${toAccount.accountNumber})`,
      relatedAccount: toAccount._id,
      date: req.user.simulationDate || Date.now()
    });

    // Log transaction for receiver
    await Transaction.create({
      user: toAccount.user,
      account: toAccount._id,
      type: 'TRANSFER',
      amount: amount,
      description: `Transfer from ${fromAccount.bankName} (${fromAccount.accountNumber})`,
      relatedAccount: fromAccount._id,
      date: req.user.simulationDate || Date.now()
    });

    res.json({ message: 'Transfer successful' });

  } catch (error) {
    // If it fails halfway, we might have inconsistent state (e.g. money deducted but not added).
    // In a real app, use transactions. Here, we accept the risk for ease of local setup.
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get account transactions
// @route   GET /api/bank/accounts/:id/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ account: req.params.id, user: req.user._id })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all user transactions
// @route   GET /api/bank/transactions
// @access  Private
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('account', 'bankName accountNumber')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBankAccount,
  getBankAccounts,
  depositMoney,
  withdrawMoney,
  transferMoney,
  getTransactions,
  getAllTransactions
};
