const SimulationSnapshot = require('../models/SimulationSnapshot');
const Transaction = require('../models/Transaction');
const { computeNetWorth } = require('../services/netWorthService');

// @desc    Get dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    // 1. Fetch ALL snapshots (scoped to current session by startSession clearing)
    const allSnapshots = await SimulationSnapshot.find({ user: req.user._id })
      .sort({ date: 1 });
    
    // 2. Downsample if too many points (Max 100 points for graph)
    // Graph resolution: ~100 points is enough for a smooth curve without noise
    let snapshots = allSnapshots;
    if (allSnapshots.length > 100) {
        const step = Math.ceil(allSnapshots.length / 100);
        snapshots = allSnapshots.filter((_, index) => index % step === 0);
        
        // Ensure the very last point is always included (Critical for final value accuracy)
        const lastSnapshot = allSnapshots[allSnapshots.length - 1];
        if (snapshots[snapshots.length - 1]._id.toString() !== lastSnapshot._id.toString()) {
            snapshots.push(lastSnapshot);
        }
    }
    
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
