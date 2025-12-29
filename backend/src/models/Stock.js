const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User-specific market
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  volatility: { type: Number, required: true }, // 0.01 to 0.1
  trend: { type: String, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'], default: 'NEUTRAL' },
  growthBias: { type: Number, default: 0 }, // Small daily bias
  lastUpdated: { type: Date, default: Date.now },
  history: [{
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number
  }],
  simulatedHistory: [{
    date: Date,
    price: Number
  }]
});

// Compound index to ensure unique symbols per user
stockSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);
