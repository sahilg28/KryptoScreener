import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle } from 'lucide-react';
import axios from 'axios';

function Watchlist({ watchlist, removeFromWatchlist }) {
  const [watchlistCoins, setWatchlistCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add API configuration
  const coingeckoApi = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 10000,
    headers: {
      'Accept': 'application/json',
    }
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchWatchlistCoins = async (retries = 3, delay = 1000) => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem('watchlistCoins');
        const cachedTimestamp = localStorage.getItem('watchlistCoinsTimestamp');
        
        // Use cached data if it's less than 2 minutes old
        if (cachedData && cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < 120000) {
          const parsedData = JSON.parse(cachedData);
          const filteredCoins = parsedData.filter(coin => watchlist.includes(coin.id));
          if (isMounted) {
            setWatchlistCoins(filteredCoins);
            setLoading(false);
          }
          return;
        }

        if (watchlist.length === 0) {
          if (isMounted) {
            setWatchlistCoins([]);
            setLoading(false);
          }
          return;
        }

        // Fetch in smaller chunks to avoid rate limits
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < watchlist.length; i += chunkSize) {
          chunks.push(watchlist.slice(i, i + chunkSize));
        }

        const allCoinsData = [];
        for (const chunk of chunks) {
          try {
            const response = await coingeckoApi.get('/coins/markets', {
              params: {
                vs_currency: 'usd',
                ids: chunk.join(','),
                order: 'market_cap_desc',
                per_page: chunk.length,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h'
              },
              signal: controller.signal
            });
            allCoinsData.push(...response.data);
          } catch (err) {
            if (err.response?.status === 429 && retries > 0) {
              // Rate limit hit - wait and retry
              await new Promise(resolve => setTimeout(resolve, delay));
              return fetchWatchlistCoins(retries - 1, delay * 2);
            }
            throw err;
          }
        }

        // Cache the results
        localStorage.setItem('watchlistCoins', JSON.stringify(allCoinsData));
        localStorage.setItem('watchlistCoinsTimestamp', Date.now().toString());

        if (isMounted) {
          setWatchlistCoins(allCoinsData);
          setError(null);
        }
      } catch (err) {
        if (!isMounted || err.name === 'AbortError') return;

        console.error('Error fetching watchlist:', err);
        
        // Try to use cached data as fallback
        const cachedData = localStorage.getItem('watchlistCoins');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const filteredCoins = parsedData.filter(coin => watchlist.includes(coin.id));
          setWatchlistCoins(filteredCoins);
          setError('Showing cached data. Please refresh for latest information.');
        } else {
          setError('Failed to fetch watchlist coins. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWatchlistCoins();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [watchlist]);

  const handleRemove = (coinId) => {
    removeFromWatchlist(coinId);
    // Update local state immediately for better UX
    setWatchlistCoins(prev => prev.filter(coin => coin.id !== coinId));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
          <p className="mt-4">Loading your watchlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="section-title mb-6">Your Watchlist</h2>
      
      {watchlistCoins.length === 0 ? (
        <div className="text-center py-8">
          <Star size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            Your watchlist is empty. Add coins from the main table to track them here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-purple-100">
                <th className="px-4 py-2 text-left">Coin</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">24h %</th>
                <th className="px-4 py-2 text-right">Market Cap</th>
                <th className="px-4 py-2 text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {watchlistCoins.map((coin) => (
                <tr key={coin.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <img src={coin.image} alt={coin.name} className="w-6 h-6 mr-2" />
                      <span>{coin.name}</span>
                      <span className="ml-2 text-gray-500 uppercase">{coin.symbol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">${coin.current_price.toLocaleString()}</td>
                  <td className={`px-4 py-2 text-right ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2 text-right">${coin.market_cap.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      onClick={() => handleRemove(coin.id)}
                      className="focus:outline-none hover:text-red-600 transition-colors"
                    >
                      <Star size={20} className="text-yellow-500 fill-current" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Watchlist;