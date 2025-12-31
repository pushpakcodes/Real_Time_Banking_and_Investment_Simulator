const express = require('express');
const router = express.Router();
const {
    getCards,
    createCard,
    spend,
    payBill
} = require('../controllers/creditCardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCards);
router.post('/', protect, createCard);
router.post('/spend', protect, spend);
router.post('/pay', protect, payBill);

module.exports = router;
