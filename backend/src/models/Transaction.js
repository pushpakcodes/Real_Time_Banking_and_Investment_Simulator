const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  type: { 
    type: String, 
    enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'INTEREST', 'EMI', 'SALARY', 'INVESTMENT', 'LOAN_DISBURSAL', 'FD_CREATION', 'FD_MATURITY', 'EXPENSE', 'PAYMENT'], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String },
  relatedAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' }, // For transfers
  date: { type: Date, required: true }, // Simulation Date
  realDate: { type: Date, default: Date.now } // Audit Date
});

module.exports = mongoose.model('Transaction', transactionSchema);
