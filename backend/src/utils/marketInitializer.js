const Stock = require('../models/Stock');

const INITIAL_STOCKS = [
  { symbol: 'TECHX', name: 'TechX Innovations', sector: 'Technology', basePrice: 150, volatility: 0.02, trend: 'BULLISH', growthBias: 0.001 },
  { symbol: 'FINCORP', name: 'FinCorp Global', sector: 'Finance', basePrice: 45, volatility: 0.015, trend: 'NEUTRAL', growthBias: 0.0002 },
  { symbol: 'MEDLIFE', name: 'MedLife Pharma', sector: 'Healthcare', basePrice: 80, volatility: 0.01, trend: 'BULLISH', growthBias: 0.0005 },
  { symbol: 'AUTOZ', name: 'AutoZ Motors', sector: 'Automotive', basePrice: 120, volatility: 0.025, trend: 'BEARISH', growthBias: -0.0005 },
  { symbol: 'GREENNRG', name: 'Green Energy Corp', sector: 'Energy', basePrice: 60, volatility: 0.03, trend: 'BULLISH', growthBias: 0.002 },
];

const initializeUserMarket = async (userId) => {
  const stocks = INITIAL_STOCKS.map(stock => ({
    user: userId,
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    currentPrice: stock.basePrice,
    volatility: stock.volatility,
    trend: stock.trend,
    growthBias: stock.growthBias,
    history: [{ date: new Date(), price: stock.basePrice }]
  }));

  await Stock.insertMany(stocks);
};

module.exports = { initializeUserMarket };
