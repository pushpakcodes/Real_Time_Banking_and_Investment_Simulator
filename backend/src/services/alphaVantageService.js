const axios = require('axios');

// Simple in-memory cache
const stockCache = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache to save API calls

const fetchStockPrice = async (symbol) => {
  const upperSymbol = symbol.toUpperCase();
  
  // Check Cache
  if (stockCache[upperSymbol] && (Date.now() - stockCache[upperSymbol].timestamp < CACHE_DURATION)) {
    console.log(`Using cached price for ${upperSymbol}`);
    return stockCache[upperSymbol].data;
  }

  const apiKey = process.env.ALPHA_VANTAGE_KEY || 'demo';
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data['Global Quote'];

    if (!data || Object.keys(data).length === 0) {
      // Fallback for demo key limitation: Generate a realistic mock price
      // so the user can still simulate with any symbol.
      console.warn(`Alpha Vantage limit reached or symbol ${symbol} not found. Using simulation fallback.`);
      
      // Deterministic random based on symbol characters to be consistent-ish
      const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const mockPrice = (seed % 500) + 50 + (Math.random() * 10); // Price between 50 and 550
      const mockChange = (Math.random() * 5 - 2.5).toFixed(2) + '%';

      const result = {
        symbol: symbol.toUpperCase(),
        price: parseFloat(mockPrice.toFixed(2)),
        changePercent: mockChange,
        isSimulated: true // Flag to indicate this is not live data
      };
      
      // Cache the fallback too to prevent jitter
      stockCache[upperSymbol] = { timestamp: Date.now(), data: result };
      return result;
    }

    const price = parseFloat(data['05. price']);
    const changePercent = data['10. change percent'];
    
    const result = {
      symbol: data['01. symbol'],
      price: price,
      changePercent: changePercent
    };

    // Store in Cache
    stockCache[upperSymbol] = { timestamp: Date.now(), data: result };
    
    return result;
  } catch (error) {
    console.error(`Alpha Vantage API Error for ${symbol}:`, error.message);
    
    // Final fallback if network error
    return {
        symbol: symbol.toUpperCase(),
        price: (Math.random() * 200 + 100).toFixed(2), // Random price
        changePercent: '0.00%',
        isSimulated: true
    };
  }
};

module.exports = { fetchStockPrice };
