const axios = require('axios');

const API_KEY = process.env.TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

const getSymbol = (symbol) => {
  let cleanSymbol = symbol.toUpperCase();
  // Handle Alpha Vantage legacy format
  if (cleanSymbol.endsWith('.NS')) {
      cleanSymbol = cleanSymbol.replace('.NS', '');
  }
  // Ensure symbol has :NSE suffix if not present
  if (cleanSymbol.includes(':')) return cleanSymbol;
  return `${cleanSymbol}:NSE`;
};

const getLatestPrice = async (symbol) => {
  try {
    const formattedSymbol = getSymbol(symbol);
    const url = `${BASE_URL}/price?symbol=${formattedSymbol}&apikey=${API_KEY}`;
    
    const response = await axios.get(url);
    
    if (response.data.status === 'error') {
        // Handle "limit exceeded" or "invalid symbol"
        if (response.data.code === 429) {
            throw new Error('API limit exceeded');
        }
        throw new Error(response.data.message);
    }

    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(response.data.price),
      // Twelve Data price endpoint doesn't return change percent, 
      // we might need /quote or /time_series for that. 
      // But user requirement says: "Latest Price Endpoint Used: /price". 
      // So we stick to price.
    };
  } catch (error) {
    console.error(`Twelve Data API Error (Price) for ${symbol}:`, error.message);
    throw error;
  }
};

const getHistoricalData = async (symbol) => {
  try {
    const formattedSymbol = getSymbol(symbol);
    const url = `${BASE_URL}/time_series?symbol=${formattedSymbol}&interval=1day&outputsize=200&apikey=${API_KEY}`;
    
    const response = await axios.get(url);
    
    if (response.data.status === 'error') {
        if (response.data.code === 429) {
            throw new Error('API limit exceeded');
        }
        throw new Error(response.data.message);
    }

    // Response format: { meta: {...}, values: [ { datetime: '2023-10-27', open: '...', ... } ] }
    return response.data.values.map(item => ({
      date: new Date(item.datetime),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume)
    })).reverse(); // Return oldest to newest
  } catch (error) {
    console.error(`Twelve Data API Error (History) for ${symbol}:`, error.message);
    throw error;
  }
};

module.exports = { getLatestPrice, getHistoricalData };
