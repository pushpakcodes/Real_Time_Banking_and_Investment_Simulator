const mongoose = require('mongoose');

const fixedDepositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true }, // Source account
  principal: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  startDate: { type: Date, required: true },
  maturityDate: { type: Date, required: true },
  compoundingFrequency: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Quarterly' },
  status: { type: String, enum: ['ACTIVE', 'MATURED', 'BROKEN'], default: 'ACTIVE' },
  accumulatedInterest: { type: Number, default: 0 }
});

module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
