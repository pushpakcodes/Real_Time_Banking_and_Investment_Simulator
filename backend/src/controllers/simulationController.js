const { advanceSimulation } = require('../services/simulationService');
const { startSession, endSession } = require('../services/simulationSessionService');
const SimulationSession = require('../models/SimulationSession');

// @desc    Advance simulation time
// @route   POST /api/simulate/advance
// @access  Private
const advanceTime = async (req, res) => {
  const { days } = req.body;

  if (!days || days <= 0) {
    return res.status(400).json({ message: 'Days must be a positive number' });
  }

  try {
    const existing = await SimulationSession.findOne({ user: req.user._id, active: true });
    if (!existing) {
      await startSession(req.user._id);
    }
    const result = await advanceSimulation(req.user, days);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const startSimSession = async (req, res) => {
  try {
    const result = await startSession(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endSimSession = async (req, res) => {
  try {
    const result = await endSession(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSimSessionStatus = async (req, res) => {
  try {
    const existing = await SimulationSession.findOne({ user: req.user._id, active: true });
    res.json({ active: !!existing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { advanceTime, startSimSession, endSimSession, getSimSessionStatus };
