const express = require('express');
const router = express.Router();
const {
  getStocks,
  getStockDetails,
  buyStock,
  sellStock,
  getPortfolio,
  getStockPrediction,
  searchStock,
  addPortfolioItem,
  getStockDirection
} = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getStocks);
router.get('/portfolio', protect, getPortfolio);
router.get('/search', protect, searchStock);
router.get('/direction/:symbol', protect, getStockDirection);
router.post('/portfolio/add', protect, addPortfolioItem);
router.get('/:id', protect, getStockDetails);
router.post('/buy', protect, buyStock);
router.post('/sell', protect, sellStock);
router.get('/:id/prediction', protect, getStockPrediction);

module.exports = router;
