const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const { getLatestPrice, getHistoricalData } = require('../services/twelveDataService');

// Helper to ensure stock data is fresh
const ensureStockUpdated = async (stock) => {
    // If simulation is far in future, don't update from real API
    // We assume if stock.simulatedHistory has entries, we are in simulation mode
    if (stock.simulatedHistory && stock.simulatedHistory.length > 0) {
        return stock;
    }

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const isStale = !stock.lastUpdated || (Date.now() - new Date(stock.lastUpdated).getTime() > ONE_DAY);
    
    if (isStale || !stock.currentPrice) {
        try {
            console.log(`Updating stock ${stock.symbol} from Twelve Data...`);
            const priceData = await getLatestPrice(stock.symbol);
            stock.currentPrice = priceData.price;
            stock.lastUpdated = Date.now();
            
            // Also fetch history if needed (e.g. empty or stale)
            // We fetch history if it's empty or stale to ensure predictions work
            if (!stock.history || stock.history.length === 0 || isStale) {
                const historyData = await getHistoricalData(stock.symbol);
                stock.history = historyData;
                
                // Calculate volatility and trend based on history
                const closes = historyData.map(h => h.close);
                if (closes.length > 1) {
                    // Calculate Daily Volatility (Standard Deviation of returns)
                    const returns = [];
                    for(let i=1; i<closes.length; i++) {
                        returns.push(Math.log(closes[i] / closes[i-1]));
                    }
                    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
                    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
                    stock.volatility = Math.sqrt(variance); // Daily volatility
                    
                    // Calculate Trend (Growth Bias) - Simple Linear Regression slope or mean return
                    // Use last 30 days for trend
                    stock.growthBias = mean; 
                    stock.trend = mean > 0.0005 ? 'BULLISH' : (mean < -0.0005 ? 'BEARISH' : 'NEUTRAL');
                }
            }

            await stock.save();
        } catch (e) {
            console.error(`Failed to auto-update stock ${stock.symbol}:`, e.message);
        }
    }
    return stock;
};

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Private
const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({ user: req.user._id }).select('-history -simulatedHistory');
    // We don't auto-update ALL stocks here to avoid API limits on list view
    // Only update if they are VERY old? Or rely on detailed view/portfolio view.
    // User requirement: "Option B: Fetch price if last update > 24 hours"
    // Let's lazily update in background if needed, but return current DB state for speed.
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
    let stock = await Stock.findOne({ _id: req.params.id, user: req.user._id });
    if (stock) {
      stock = await ensureStockUpdated(stock);
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
    let stock = await Stock.findOne({ _id: stockId, user: req.user._id });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    // Ensure price is fresh for transaction
    stock = await ensureStockUpdated(stock);

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
    let stock = await Stock.findOne({ _id: stockId, user: req.user._id });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    // Ensure price is fresh for transaction
    stock = await ensureStockUpdated(stock);

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
      type: 'INVESTMENT', 
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
    
    // Ensure all stocks in portfolio are updated
    // This is important for accurate P/L
    await Promise.all(portfolio.map(item => ensureStockUpdated(item.stock)));

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
        let stock = await Stock.findOne({ _id: req.params.id, user: req.user._id });
        if (!stock) return res.status(404).json({ message: 'Stock not found' });

        // Ensure we have historical data for prediction
        stock = await ensureStockUpdated(stock);

        const predictions = [];
        let currentSimPrice = stock.currentPrice;
        
        // "Predictions must be explainable... Moving averages... Trend extrapolation"
        // Use the volatility and drift calculated in ensureStockUpdated (or default)
        
        // If simulated history exists, start prediction from the end of simulation
        if (stock.simulatedHistory && stock.simulatedHistory.length > 0) {
             currentSimPrice = stock.simulatedHistory[stock.simulatedHistory.length - 1].price;
        }

        for (let i = 1; i <= numDays; i++) {
            const drift = stock.growthBias || 0;
            // Expected price (No shock)
            const expectedPrice = currentSimPrice * Math.pow(1 + drift, i);
            
            // Confidence Interval (95%) ~ 1.96 * volatility * sqrt(i)
            const sigma = (stock.volatility || 0.02) * Math.sqrt(i);
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

// @desc    Search stock price
// @route   GET /api/stocks/search
// @access  Private
const searchStock = async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

  try {
    const data = await getLatestPrice(symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add existing stock to portfolio (No cost)
// @route   POST /api/stocks/portfolio/add
// @access  Private
const addPortfolioItem = async (req, res) => {
  const { symbol, quantity } = req.body; 

  if (!symbol || !quantity) {
    return res.status(400).json({ message: 'Symbol and quantity are required' });
  }

  try {
    const data = await getLatestPrice(symbol);
    const currentPrice = data.price;
    const historyData = await getHistoricalData(symbol);

    // Find or Create Stock in DB
    let stock = await Stock.findOne({ user: req.user._id, symbol: symbol.toUpperCase() });
    
    if (!stock) {
        // Calculate init stats
        let volatility = 0.02;
        let trend = 'NEUTRAL';
        let growthBias = 0;

        if (historyData.length > 1) {
             const closes = historyData.map(h => h.close);
             const returns = [];
             for(let i=1; i<closes.length; i++) {
                 returns.push(Math.log(closes[i] / closes[i-1]));
             }
             const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
             const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
             volatility = Math.sqrt(variance);
             growthBias = mean;
             trend = mean > 0.0005 ? 'BULLISH' : (mean < -0.0005 ? 'BEARISH' : 'NEUTRAL');
        }

        stock = await Stock.create({
            user: req.user._id,
            symbol: symbol.toUpperCase(),
            name: symbol.toUpperCase(),
            sector: 'Unknown', // API doesn't return sector in price endpoint
            currentPrice: currentPrice,
            volatility: volatility,
            trend: trend,
            growthBias: growthBias,
            lastUpdated: Date.now(),
            history: historyData
        });
    } else {
        // Update price
        stock.currentPrice = currentPrice;
        stock.lastUpdated = Date.now();
        stock.history = historyData; // Refresh history
        await stock.save();
    }

    // Update Portfolio
    let portfolioItem = await Portfolio.findOne({ user: req.user._id, stock: stock._id });
    if (portfolioItem) {
        // Weighted average calculation
        const totalValue = (portfolioItem.averageBuyPrice * portfolioItem.quantity) + (currentPrice * quantity);
        portfolioItem.quantity += Number(quantity);
        portfolioItem.averageBuyPrice = totalValue / portfolioItem.quantity;
        await portfolioItem.save();
    } else {
        await Portfolio.create({
            user: req.user._id,
            stock: stock._id,
            quantity: Number(quantity),
            averageBuyPrice: currentPrice
        });
    }

    res.json({ message: 'Stock added to portfolio successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStocks, getStockDetails, buyStock, sellStock, getPortfolio, getStockPrediction, searchStock, addPortfolioItem };
