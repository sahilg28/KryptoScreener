import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TrendingPage() {
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingCoins = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/search/trending');
        setTrendingCoins(response.data.coins.slice(0, 7));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trending coins:', error);
        setLoading(false);
      }
    };

    fetchTrendingCoins();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
          <p className="mt-4">Loading trending coins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="section-title mb-6">Weekly Top Trending Coins</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {trendingCoins.map((coin) => (
          <div key={coin.item.id} className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <img src={coin.item.large} alt={coin.item.name} className="w-12 h-12 rounded-full" />
              <span className="text-2xl font-bold text-purple-600">#{coin.item.market_cap_rank}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{coin.item.name}</h3>
            <p className="text-gray-600 mb-2">{coin.item.symbol}</p>
            <p className="text-sm text-gray-500">Market Cap Rank: {coin.item.market_cap_rank || 'N/A'}</p>
            <div className="mt-4">
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                Trending
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrendingPage;