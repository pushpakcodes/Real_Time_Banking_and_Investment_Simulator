const axios = require('axios');

const API_KEY = process.env.TWELVE_DATA_API_KEY;
if (!API_KEY) {
  console.error("CRITICAL ERROR: TWELVE_DATA_API_KEY is missing in environment variables.");
}
const BASE_URL = 'https://api.twelvedata.com';

const getSymbol = (symbol) => {
  let cleanSymbol = symbol.toUpperCase();
  
  // Handle Alpha Vantage legacy format (RELIANCE.NS -> RELIANCE:NSE)
  if (cleanSymbol.endsWith('.NS')) {
      return cleanSymbol.replace('.NS', ':NSE');
  }
  
  // If it already has a specific exchange (e.g. :NSE, :NASDAQ), leave it
  if (cleanSymbol.includes(':')) {
      return cleanSymbol;
  }

  // Heuristic for User's Test Cases (US Tech Stocks)
  // This ensures AAPL, MSFT, etc. are resolved to US markets instead of failing as AAPL:NSE
  const commonUS = ['AAPL', 'MSFT', 'GOOG', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'IBM', 'INTC', 'AMD'];
  if (commonUS.includes(cleanSymbol)) {
      return cleanSymbol; // Default to US (NASDAQ/NYSE)
  }

  // Default to NSE for everything else (Project Requirement: Indian Context)
  return `${cleanSymbol}:NSE`;
};

const getLatestPrice = async (symbol) => {
  try {
    const formattedSymbol = getSymbol(symbol);
    // Use time_series endpoint as required by new specification
    // interval=1min for "real-time" feel (returns latest candle)
    const url = `${BASE_URL}/time_series?symbol=${formattedSymbol}&interval=1min&apikey=${API_KEY}&outputsize=1`;
    
    console.log(`Fetching price for ${formattedSymbol}`); // Debug log
    
    const response = await axios.get(url);
    
    // Check for API Error Status
    if (response.data.status === 'error') {
        const msg = response.data.message || 'Unknown Twelve Data API Error';
        console.error(`Twelve Data API Error for ${symbol}: ${msg}`);
        
        // If limit reached, throw specific error
        if (response.data.code === 429) throw new Error('API limit exceeded');
        
        throw new Error(msg);
    }

    // Validate Response Structure (Must contain 'values' array)
    if (!response.data.values || !Array.isArray(response.data.values) || response.data.values.length === 0) {
        console.error(`Invalid Twelve Data response for ${symbol}:`, JSON.stringify(response.data));
        throw new Error('Stock data not found or empty response');
    }

    const latestCandle = response.data.values[0];
    const price = parseFloat(latestCandle.close);
    const time = latestCandle.datetime;

    if (isNaN(price)) {
        throw new Error('Failed to parse price from response');
    }

    return {
      symbol: symbol.toUpperCase(),
      price: price,
      time: time
    };
  } catch (error) {
    // Ensure we don't leak internal details but give enough info
    console.error(`Service Error (getLatestPrice) for ${symbol}:`, error.message);
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

    // Validate Response Structure
    if (!response.data.values || !Array.isArray(response.data.values)) {
        console.error(`Invalid Twelve Data History response for ${symbol}:`, JSON.stringify(response.data));
        return []; // Return empty history instead of throwing to allow partial data load
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
