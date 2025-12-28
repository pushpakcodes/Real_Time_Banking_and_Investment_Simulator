const mongoose = require('mongoose');

const simulationSnapshotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  netWorth: { type: Number, required: true },
  totalBankBalance: { type: Number, required: true },
  totalStockValue: { type: Number, required: true },
  totalLoanLiability: { type: Number, required: true },
  totalFDValue: { type: Number, required: true }
});

module.exports = mongoose.model('SimulationSnapshot', simulationSnapshotSchema);
