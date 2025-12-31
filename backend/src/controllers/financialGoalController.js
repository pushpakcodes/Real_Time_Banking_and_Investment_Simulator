const FinancialGoal = require('../models/FinancialGoal');

// @desc    Get all financial goals
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res) => {
  try {
    const goals = await FinancialGoal.find({ user: req.user._id }).sort({ deadline: 1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new financial goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res) => {
  const { title, targetAmount, deadline, priority, notes } = req.body;

  if (!title || !targetAmount || !deadline) {
    return res.status(400).json({ message: 'Please provide title, target amount and deadline' });
  }

  try {
    const goal = await FinancialGoal.create({
      user: req.user._id,
      title,
      targetAmount,
      deadline,
      priority,
      notes
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a goal (e.g. add funds)
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res) => {
  const { currentAmount, status } = req.body;

  try {
    const goal = await FinancialGoal.findOne({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (status) goal.status = status;

    // Auto-complete if target reached
    if (goal.currentAmount >= goal.targetAmount && goal.status !== 'COMPLETED') {
        goal.status = 'COMPLETED';
    }

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res) => {
  try {
    const goal = await FinancialGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
};
