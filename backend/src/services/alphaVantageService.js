const axios = require('axios');

const fetchStockPrice = async (symbol) => {
  const apiKey = process.env.ALPHA_VANTAGE_KEY || 'demo';
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data['Global Quote'];

    if (!data || Object.keys(data).length === 0) {
      // Fallback for demo key limitation or invalid symbol
      // If demo key is used, it only works for IBM. 
      // If symbol is not IBM and key is demo, we might get empty result or error.
      // We will throw error to let user know.
      throw new Error('Stock not found or API limit reached');
    }

    const price = parseFloat(data['05. price']);
    const changePercent = data['10. change percent'];
    
    return {
      symbol: data['01. symbol'],
      price: price,
      changePercent: changePercent
    };
  } catch (error) {
    console.error(`Alpha Vantage API Error for ${symbol}:`, error.message);
    throw new Error('Failed to fetch stock price');
  }
};

module.exports = { fetchStockPrice };
