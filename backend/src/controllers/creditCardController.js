const CreditCard = require('../models/CreditCard');
const creditCardService = require('../services/creditCardService');

// @desc    Get user credit cards
// @route   GET /api/credit-cards
// @access  Private
const getCards = async (req, res) => {
    try {
        const cards = await CreditCard.find({ user: req.user._id });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new credit card
// @route   POST /api/credit-cards
// @access  Private
const createCard = async (req, res) => {
    try {
        const { limit } = req.body;
        const card = await creditCardService.createCard(req.user._id, limit);
        res.status(201).json(card);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Spend on credit card
// @route   POST /api/credit-cards/spend
// @access  Private
const spend = async (req, res) => {
    try {
        const { cardId, amount, description } = req.body;
        const card = await creditCardService.spend(cardId, amount, description, req.user.simulationDate);
        res.json(card);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Pay credit card bill
// @route   POST /api/credit-cards/pay
// @access  Private
const payBill = async (req, res) => {
    try {
        const { cardId, amount, fromAccountId } = req.body;
        const result = await creditCardService.payBill(req.user._id, cardId, amount, fromAccountId, req.user.simulationDate);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getCards,
    createCard,
    spend,
    payBill
};
