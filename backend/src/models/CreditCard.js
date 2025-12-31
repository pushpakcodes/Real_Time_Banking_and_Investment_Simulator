const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardName: {
    type: String,
    required: true,
    default: 'Standard Credit Card'
  },
  cardNumber: {
    type: String,
    unique: true,
    required: true
  },
  creditLimit: {
    type: Number,
    required: true,
    default: 50000
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  availableCredit: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    default: 36 // 36% Annual
  },
  billingDay: {
    type: Number,
    default: 1
  },
  dueDay: {
    type: Number,
    default: 20 // 20 days after billing
  },
  minimumDuePercent: {
    type: Number,
    default: 0.05 // 5%
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'BLOCKED', 'CLOSED'],
    default: 'ACTIVE'
  },
  lastStatementDate: {
    type: Date
  },
  nextDueDate: {
    type: Date
  },
  statementBalance: {
    type: Number,
    default: 0
  },
  minimumDue: {
    type: Number,
    default: 0
  },
  totalInterestPaid: {
    type: Number,
    default: 0
  },
  missedPaymentsCount: {
    type: Number,
    default: 0
  },
  lastInterestAppliedDate: {
    type: Date
  }
}, { timestamps: true });

// Ensure availableCredit + outstandingBalance always roughly equals creditLimit (ignoring interest overlimit)
// But for safety, we recalculate availableCredit on save? 
// No, let's keep them separate but consistent.

module.exports = mongoose.model('CreditCard', creditCardSchema);
