import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import PageBanner from '../components/PageBanner';

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
          // Don't show the error message when using cached data as fallback
          setError(null);
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
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-700 mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base">Loading your watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <PageBanner 
        title="Your Watchlist"
        description="Track your favorite cryptocurrencies and stay updated with real-time price changes"
      />
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle size={24} className="text-red-500 mr-3" />
            <p className="text-sm sm:text-base text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {watchlistCoins.length === 0 ? (
        <div className="text-center py-6 sm:py-8 bg-white rounded-lg shadow-md">
          <Star size={36} className="mx-auto mb-4 text-gray-400" />
          <p className="text-sm sm:text-base text-gray-600">
            Your watchlist is empty. Add coins from the main table to track them here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full mobile-table">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coin
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  24h %
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Market Cap
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {watchlistCoins.map((coin) => (
                <tr key={coin.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-4 whitespace-nowrap" data-label="Coin">
                    <div className="flex items-center">
                      <img src={coin.image} alt={coin.name} className="w-6 h-6 mr-2 flex-shrink-0" />
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium text-gray-900 truncate max-w-[120px]">{coin.name}</span>
                        <span className="text-xs text-gray-500 uppercase sm:ml-2">{coin.symbol}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm sm:text-right" data-label="Price">
                    ${coin.current_price.toLocaleString()}
                  </td>
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-right hidden sm:table-cell ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg ${
                      coin.price_change_percentage_24h >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right hidden md:table-cell">
                    ${coin.market_cap.toLocaleString()}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center" data-label="Remove">
                    <button 
                      onClick={() => handleRemove(coin.id)}
                      className="p-1.5 rounded-full hover:bg-red-100 focus:outline-none transition-colors"
                      aria-label={`Remove ${coin.name} from watchlist`}
                    >
                      <Star size={18} className="text-yellow-500 fill-current" />
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