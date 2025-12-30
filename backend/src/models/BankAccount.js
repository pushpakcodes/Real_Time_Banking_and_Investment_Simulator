const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Savings', 'Current'], default: 'Savings' },
  balance: { type: Number, required: true, default: 0 },
  interestRate: { type: Number, default: 3.5 }, // Annual Interest Rate %
  monthlyDeposit: {
    amount: { type: Number, default: 0 },
    dayOfMonth: { type: Number, min: 1, max: 31, default: 1 },
    active: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BankAccount', bankAccountSchema);
