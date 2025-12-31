const SimulationSnapshot = require('../models/SimulationSnapshot');
const Transaction = require('../models/Transaction');
const { computeNetWorth } = require('../services/netWorthService');

// @desc    Get dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const snapshots = await SimulationSnapshot.find({ user: req.user._id })
      .sort({ date: 1 })
      .limit(30);
    
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1, realDate: -1 })
      .limit(5)
      .populate('account', 'bankName accountNumber');

    const current = await computeNetWorth(req.user._id, 'LIVE');

    res.json({
      snapshots,
      recentTransactions,
      current
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardData };
