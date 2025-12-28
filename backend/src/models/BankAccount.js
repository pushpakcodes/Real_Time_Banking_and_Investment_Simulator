const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Savings', 'Current'], default: 'Savings' },
  balance: { type: Number, required: true, default: 0 },
  interestRate: { type: Number, default: 3.5 }, // Annual Interest Rate %
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BankAccount', bankAccountSchema);
