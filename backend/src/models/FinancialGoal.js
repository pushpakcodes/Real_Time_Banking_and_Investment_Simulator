const mongoose = require('mongoose');

const financialGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
    default: 'IN_PROGRESS'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('FinancialGoal', financialGoalSchema);
