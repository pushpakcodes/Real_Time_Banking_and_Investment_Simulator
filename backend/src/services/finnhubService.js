const axios = require('axios');

const API_KEY = 'd5afpphr01qn2tatvpi0d5afpphr01qn2tatvpig';
const BASE_URL = 'https://finnhub.io/api/v1';

// In-memory cache: { symbol: { data: { direction, confidence, source }, timestamp: number } }
const recommendationCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getDirectionalTrend = async (symbol) => {
  const upperSymbol = symbol.toUpperCase();

  // 1. Check Cache
  if (recommendationCache[upperSymbol]) {
    const cached = recommendationCache[upperSymbol];
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    // 2. Call Finnhub API
    // Endpoint: /stock/recommendation
    const response = await axios.get(`${BASE_URL}/stock/recommendation`, {
      params: {
        symbol: upperSymbol,
        token: API_KEY
      }
    });

    const data = response.data;

    // 3. Process Data
    // Finnhub returns an array of objects, latest first. We take the first one.
    // Example: [{ buy: 12, hold: 6, sell: 2, strongBuy: 4, strongSell: 1, period: "2023-10-01" }, ...]
    
    let direction = 'SIDEWAYS';
    let confidence = 0;
    
    if (data && data.length > 0) {
      const latest = data[0];
      
      const strongBuy = latest.strongBuy || 0;
      const buy = latest.buy || 0;
      const hold = latest.hold || 0;
      const sell = latest.sell || 0;
      const strongSell = latest.strongSell || 0;

      const bullishScore = strongBuy + buy;
      const bearishScore = strongSell + sell;
      const totalRatings = bullishScore + bearishScore + hold;

      // Direction Logic
      if (bullishScore > bearishScore) {
        direction = 'UP';
      } else if (bearishScore > bullishScore) {
        direction = 'DOWN';
      } else {
        direction = 'SIDEWAYS';
      }

      // Confidence Logic
      if (totalRatings > 0) {
        confidence = Math.abs(bullishScore - bearishScore) / totalRatings;
      }
    } else {
        // No data found, default to SIDEWAYS with 0 confidence
        console.warn(`[Finnhub] No recommendation data found for ${upperSymbol}`);
    }

    const result = {
      symbol: upperSymbol,
      direction,
      confidence: Number(confidence.toFixed(2)),
      source: 'Finnhub Analyst Sentiment'
    };

    // 4. Update Cache
    recommendationCache[upperSymbol] = {
      data: result,
      timestamp: Date.now()
    };

    return result;

  } catch (error) {
    console.error(`[Finnhub] Error fetching recommendation for ${upperSymbol}:`, error.message);
    
    // Fallback on error: Return SIDEWAYS (don't crash simulation)
    // If we have stale cache, maybe use it? For now, strict requirement says "Return SIDEWAYS with low confidence" if fails.
    // But requirement 3 says "Use last known signal if API fails".
    if (recommendationCache[upperSymbol]) {
        console.log(`[Finnhub] Using stale cache for ${upperSymbol}`);
        return recommendationCache[upperSymbol].data;
    }

    return {
      symbol: upperSymbol,
      direction: 'SIDEWAYS',
      confidence: 0,
      source: 'Finnhub (Fallback)'
    };
  }
};

module.exports = { getDirectionalTrend };
