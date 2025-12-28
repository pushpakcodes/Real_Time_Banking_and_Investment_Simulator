const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Private
const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({ user: req.user._id }).select('-history'); // Exclude history for list view
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock details with history
// @route   GET /api/stocks/:id
// @access  Private
const getStockDetails = async (req, res) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, user: req.user._id });
    if (stock) {
      res.json(stock);
    } else {
      res.status(404).json({ message: 'Stock not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buy stock
// @route   POST /api/stocks/buy
// @access  Private
const buyStock = async (req, res) => {
  const { stockId, quantity, accountId } = req.body;

  if (quantity <= 0) return res.status(400).json({ message: 'Quantity must be positive' });

  try {
    const stock = await Stock.findOne({ _id: stockId, user: req.user._id });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const account = await BankAccount.findOne({ _id: accountId, user: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const cost = stock.currentPrice * quantity;
    if (account.balance < cost) return res.status(400).json({ message: 'Insufficient funds' });

    // Deduct money
    account.balance -= cost;
    await account.save();

    // Add to portfolio
    let portfolioItem = await Portfolio.findOne({ user: req.user._id, stock: stockId });
    if (portfolioItem) {
      // Calculate new average price
      const totalValue = (portfolioItem.averageBuyPrice * portfolioItem.quantity) + cost;
      portfolioItem.quantity += Number(quantity);
      portfolioItem.averageBuyPrice = totalValue / portfolioItem.quantity;
      await portfolioItem.save();
    } else {
      await Portfolio.create({
        user: req.user._id,
        stock: stockId,
        quantity,
        averageBuyPrice: stock.currentPrice
      });
    }

    // Log Transaction
    await Transaction.create({
      user: req.user._id,
      account: account._id,
      type: 'INVESTMENT',
      amount: -cost,
      description: `Bought ${quantity} ${stock.symbol} @ ${stock.currentPrice}`,
      date: req.user.simulationDate || Date.now()
    });

    res.json({ message: 'Stock bought successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sell stock
// @route   POST /api/stocks/sell
// @access  Private
const sellStock = async (req, res) => {
  const { stockId, quantity, accountId } = req.body;

  if (quantity <= 0) return res.status(400).json({ message: 'Quantity must be positive' });

  try {
    const stock = await Stock.findOne({ _id: stockId, user: req.user._id });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const account = await BankAccount.findOne({ _id: accountId, user: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const portfolioItem = await Portfolio.findOne({ user: req.user._id, stock: stockId });
    if (!portfolioItem || portfolioItem.quantity < quantity) {
      return res.status(400).json({ message: 'Not enough shares to sell' });
    }

    const proceeds = stock.currentPrice * quantity;

    // Add money
    account.balance += proceeds;
    await account.save();

    // Update portfolio
    portfolioItem.quantity -= Number(quantity);
    if (portfolioItem.quantity === 0) {
      await Portfolio.deleteOne({ _id: portfolioItem._id });
    } else {
      await portfolioItem.save();
    }

    // Log Transaction
    await Transaction.create({
      user: req.user._id,
      account: account._id,
      type: 'INVESTMENT', // Or Divestment? reusing Investment with positive amount?
      // Wait, in previous step I used negative for 'INVESTMENT' cost.
      // Here proceeds are positive.
      amount: proceeds,
      description: `Sold ${quantity} ${stock.symbol} @ ${stock.currentPrice}`,
      date: req.user.simulationDate || Date.now()
    });

    res.json({ message: 'Stock sold successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user portfolio
// @route   GET /api/stocks/portfolio
// @access  Private
const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id }).populate('stock');
    // Calculate Unrealized P/L
    const enrichedPortfolio = portfolio.map(item => {
      const currentValue = item.stock.currentPrice * item.quantity;
      const investedValue = item.averageBuyPrice * item.quantity;
      const pl = currentValue - investedValue;
      const plPercent = (pl / investedValue) * 100;
      return {
        ...item.toObject(),
        currentValue,
        pl,
        plPercent
      };
    });
    res.json(enrichedPortfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock prediction
// @route   GET /api/stocks/:id/prediction
// @access  Private
const getStockPrediction = async (req, res) => {
    const { days } = req.query; // e.g. 7, 30, 365
    const numDays = parseInt(days) || 30;

    try {
        const stock = await Stock.findOne({ _id: req.params.id, user: req.user._id });
        if (!stock) return res.status(404).json({ message: 'Stock not found' });

        const predictions = [];
        let currentSimPrice = stock.currentPrice;
        
        // Monte Carlo Simulation (Run 100 paths and average? Or just expected value?)
        // "Predictions must be explainable... Moving averages... Trend extrapolation"
        // Let's use Expected Value = Price * (1 + Drift)^t
        // And Confidence Interval based on Volatility * sqrt(t)
        
        for (let i = 1; i <= numDays; i++) {
            const drift = stock.growthBias;
            // Expected price (No shock)
            const expectedPrice = stock.currentPrice * Math.pow(1 + drift, i);
            
            // Confidence Interval (95%) ~ 1.96 * volatility * sqrt(i) (simplified approximation for daily vol)
            const sigma = stock.volatility * Math.sqrt(i);
            const upper = expectedPrice * (1 + 1.96 * sigma);
            const lower = expectedPrice * (1 - 1.96 * sigma);

            predictions.push({
                day: i,
                expectedPrice,
                upperBound: upper,
                lowerBound: lower
            });
        }

        res.json({
            symbol: stock.symbol,
            days: numDays,
            predictions
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStocks, getStockDetails, buyStock, sellStock, getPortfolio, getStockPrediction };
