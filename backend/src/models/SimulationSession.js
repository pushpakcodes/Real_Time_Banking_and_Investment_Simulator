const mongoose = require('mongoose');

const simulationSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  active: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  baseline: {
    user: {
      simulationDate: Date,
      virtualNetWorth: Number
    },
    accounts: [{
      _id: mongoose.Schema.Types.ObjectId,
      balance: Number
    }],
    stocks: [{
      _id: mongoose.Schema.Types.ObjectId,
      currentPrice: Number
    }],
    loans: [{
      _id: mongoose.Schema.Types.ObjectId,
      remainingBalance: Number,
      status: String
    }],
    fds: [{
      _id: mongoose.Schema.Types.ObjectId,
      status: String
    }]
  },
  transactionsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
});

module.exports = mongoose.model('SimulationSession', simulationSessionSchema);
