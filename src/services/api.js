import axios from 'axios';

const API_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'x-cg-demo-api-key': API_KEY
  }
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getTopCoins = async (page = 1, perPage = 100, currency = 'inr', retries = 3) => {
  try {
    const response = await api.get('/coins/markets', {
      params: {
        vs_currency: currency,
        order: 'market_cap_desc',
        per_page: perPage,
        page: page,
        sparkline: false
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      // Wait for 2 seconds before retrying on rate limit
      await delay(2000);
      return getTopCoins(page, perPage, currency, retries - 1);
    }
    console.error('Error fetching top coins:', error);
    throw error;
  }
};

export const getCoinChart = async (id, days = 7, currency = 'usd') => {
  try {
    const response = await api.get(`/coins/${id}/market_chart`, {
      params: {
        vs_currency: currency,
        days: days,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return { prices: [] };
  }
};

export const getTotalCoins = async () => {
  try {
    const response = await api.get('/global');
    return response.data.data.active_cryptocurrencies;
  } catch (error) {
    console.error('Error fetching total coins:', error);
    return 0;
  }
};

export const getGlobalStats = async () => {
  try {
    const response = await api.get('/global');
    return response.data;
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw error;
  }
};