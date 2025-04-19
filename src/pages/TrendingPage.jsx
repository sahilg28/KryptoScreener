import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TrendingPage() {
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('live'); // 'live' | 'cache' | 'stale'

  // Improved API configuration
  const coingeckoApi = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 15000, // Increased timeout to 15 seconds
    headers: {
      'Accept': 'application/json',
    }
  });

  // Cache duration increased to 15 minutes
  const CACHE_DURATION = 15 * 60 * 1000;
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 1000;

  const getCachedData = () => {
    try {
      const cachedData = localStorage.getItem('trendingCoins');
      const cachedTimestamp = localStorage.getItem('trendingCoinsTimestamp');
      
      if (!cachedData || !cachedTimestamp) return null;

      const isStale = (Date.now() - parseInt(cachedTimestamp)) > CACHE_DURATION;
      return {
        data: JSON.parse(cachedData),
        isStale,
        timestamp: parseInt(cachedTimestamp)
      };
    } catch (error) {
      console.error('Cache reading error:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      // First, immediately show cached data if available
      const cachedResult = getCachedData();
      if (cachedResult) {
        setTrendingCoins(cachedResult.data);
        setLoading(false);
        setDataSource(cachedResult.isStale ? 'stale' : 'cache');
      }

      const fetchWithRetry = async (retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
        try {
          const [trendingResponse, marketResponse] = await Promise.all([
            coingeckoApi.get('/search/trending', { signal: controller.signal }),
            coingeckoApi.get('/simple/price', {
              params: {
                ids: 'bitcoin,ethereum',
                vs_currencies: 'usd,inr,eur,aed,cad'
              },
              signal: controller.signal
            })
          ]);

          if (!isMounted) return;

          const coins = trendingResponse.data.coins.slice(0, 10);
          const coinIds = coins.map(coin => coin.item.id).join(',');

          const priceResponse = await coingeckoApi.get('/coins/markets', {
            params: {
              vs_currency: 'usd',
              ids: coinIds,
              order: 'market_cap_desc',
              per_page: 10,
              page: 1,
              sparkline: false,
              price_change_percentage: '1h,24h,7d'
            },
            signal: controller.signal
          });

          const enrichedCoins = coins.map(coin => {
            const priceData = priceResponse.data.find(p => p.id === coin.item.id) || {};
            return {
              ...coin,
              priceData: {
                current_price: priceData.current_price || 'N/A',
                price_change_24h: priceData.price_change_percentage_24h || 0,
                price_change_1h: priceData.price_change_percentage_1h_in_currency || 0,
                market_cap: priceData.market_cap || 'N/A',
                total_volume: priceData.total_volume || 'N/A'
              }
            };
          });

          if (isMounted) {
            setTrendingCoins(enrichedCoins);
            setLoading(false);
            setError(null);
            setDataSource('live');
            
            // Update cache
            localStorage.setItem('trendingCoins', JSON.stringify(enrichedCoins));
            localStorage.setItem('trendingCoinsTimestamp', Date.now().toString());
          }
        } catch (err) {
          if (err.name === 'AbortError') return;

          if (retries > 0) {
            // Retry on any error, not just rate limits
            const nextDelay = Math.min(delay * 1.5, 10000); // Cap delay at 10 seconds
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(retries - 1, nextDelay);
          }
          throw err;
        }
      };

      try {
        await fetchWithRetry();
      } catch (err) {
        if (isMounted) {
          console.error('Error:', err);
          // Don't override the UI if we're showing cached data
          if (!cachedResult) {
            setError('Unable to fetch latest data. Please try again later.');
            setLoading(false);
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto" />
        <p className="mt-4">Loading! Please wait...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  const CoinCard = ({ coin }) => (
    <div className="bg-white rounded-lg shadow-md p-4 transform hover:shadow-purple-500 transition-transform duration-300 w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={coin.item.large} alt={coin.item.name} className="w-10 h-10 rounded-full" />
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">{coin.item.name}</h3>
            <span className="text-gray-600 ml-2 uppercase">({coin.item.symbol})</span>
          </div>
        </div>
        <span className="text-xl font-bold text-purple-600">#{coin.item.market_cap_rank || 'N/A'}</span>
      </div>
      
      <p className="text-purple-600 font-semibold mb-2">
        Price: ${coin.priceData.current_price?.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8,
        }) || 'N/A'}
      </p>
      
      <div className="flex items-center gap-4 mb-3 font-semibold">
        <p className={`${coin.priceData.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          24h: {coin.priceData.price_change_24h.toFixed(2)}%
        </p>
        <p className={`${coin.priceData.price_change_1h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          1h: {coin.priceData.price_change_1h.toFixed(2) || 'N/A'}%
        </p>
      </div>

      <div>
        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
          Trending
        </span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="section-title mb-4">Top Trending Cryptocurrencies</h2>
      <div className="mb-8">
        <p className="text-gray-600 mb-2">
          Discover the top trending cryptocurrencies on Kryptoscreener. This list is sorted by the coins that have been most searched for in the last 3 hours, providing you with the latest insights into the hottest trends in the crypto market.
        </p>
        {dataSource !== 'live' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700">
              {dataSource === 'cache' ? 
                'Showing recently cached data while fetching latest information...' : 
                'Showing older cached data. We\'re having trouble connecting to our servers.'}
            </p>
          </div>
        )}
        <p className="text-gray-500 text-sm">
          Note: The data for these coins is provided by CoinGecko, meaning the trending coins displayed here are the ones most searched on CoinGecko in the last 3 hours.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trendingCoins.map((coin) => (
          <CoinCard key={coin.item.id} coin={coin} />
        ))}
      </div>
    </div>
  );
}

export default TrendingPage;
