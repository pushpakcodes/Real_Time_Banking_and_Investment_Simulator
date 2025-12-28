const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['PERSONAL', 'HOME', 'EDUCATION'], required: true },
  principal: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  tenureMonths: { type: Number, required: true },
  startDate: { type: Date, required: true },
  remainingBalance: { type: Number, required: true },
  emiAmount: { type: Number, required: true },
  status: { type: String, enum: ['ACTIVE', 'CLOSED', 'DEFAULTED'], default: 'ACTIVE' },
  totalInterestPaid: { type: Number, default: 0 }
});

module.exports = mongoose.model('Loan', loanSchema);
