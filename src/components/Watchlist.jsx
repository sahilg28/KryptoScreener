import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle } from 'lucide-react';
import { getTopCoins } from '../services/api';

function Watchlist({ watchlist, removeFromWatchlist }) {
  const [watchlistCoins, setWatchlistCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWatchlistCoins = async () => {
      try {
        setLoading(true);
        setError(null);
        const allCoins = await getTopCoins(1, 250);
        const filteredCoins = allCoins.filter(coin => watchlist.includes(coin.id));
        setWatchlistCoins(filteredCoins);
      } catch (err) {
        setError('Failed to fetch watchlist coins. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (watchlist.length > 0) {
      fetchWatchlistCoins();
    } else {
      setWatchlistCoins([]);
      setLoading(false);
    }
  }, [watchlist]);

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
                <th className="px-4 py-2">Coin</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">24h %</th>
                <th className="px-4 py-2">Market Cap</th>
                <th className="px-4 py-2">Remove</th>
              </tr>
            </thead>
            <tbody>
              {watchlistCoins.map((coin) => (
                <tr key={coin.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 flex items-center">
                    <img src={coin.image} alt={coin.name} className="w-6 h-6 mr-2" />
                    <span>{coin.name}</span>
                    <span className="ml-2 text-gray-500 uppercase">{coin.symbol}</span>
                  </td>
                  <td className="px-4 py-2">${coin.current_price.toLocaleString()}</td>
                  <td className={`px-4 py-2 ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2">${coin.market_cap.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button 
                      onClick={() => removeFromWatchlist(coin.id)}
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