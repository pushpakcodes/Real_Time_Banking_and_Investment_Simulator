const { advanceSimulation } = require('../services/simulationService');

// @desc    Advance simulation time
// @route   POST /api/simulate/advance
// @access  Private
const advanceTime = async (req, res) => {
  const { days } = req.body;

  if (!days || days <= 0) {
    return res.status(400).json({ message: 'Days must be a positive number' });
  }

  try {
    const result = await advanceSimulation(req.user, days);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { advanceTime };
