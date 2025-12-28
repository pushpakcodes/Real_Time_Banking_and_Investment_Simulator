const SimulationSnapshot = require('../models/SimulationSnapshot');
const Transaction = require('../models/Transaction');

// @desc    Get dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    // Get last 30 snapshots for chart
    const snapshots = await SimulationSnapshot.find({ user: req.user._id })
      .sort({ date: 1 })
      .limit(30); // Or fetch all and downsample? 
      // If user has 365 days, we might want all or aggregate. 
      // For now, let's just return sorted by date.
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1, realDate: -1 })
      .limit(5)
      .populate('account', 'bankName accountNumber');

    res.json({
      snapshots,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardData };
