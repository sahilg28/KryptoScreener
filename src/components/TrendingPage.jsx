import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TrendingPage() {
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trendingResponse = await axios.get('https://api.coingecko.com/api/v3/search/trending');
        const coins = trendingResponse.data.coins.slice(0, 10);

        const coinIds = coins.map((coin) => coin.item.id).join(',');
        const priceResponse = await axios.get(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h,24h,7d`
        );

        const enrichedCoins = coins.map((coin) => {
          const priceData = priceResponse.data.find((p) => p.id === coin.item.id) || {}; // Fallback for missing data
          return {
            ...coin,
            priceData: {
              current_price: priceData.current_price || 'N/A',
              price_change_24h: priceData.price_change_percentage_24h || 0,
              price_change_1h: priceData.price_change_percentage_1h_in_currency || 0,
            },
          };
        });

        setTrendingCoins(enrichedCoins);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch trending coins. Please try again later.'); // Set error message
      } finally {
        setLoading(false); // Ensure loading state is updated
      }
    };

    fetchData();
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
    <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
      <div className="flex items-center justify-between mb-4">
        <img src={coin.item.large} alt={coin.item.name} className="w-12 h-12 rounded-full" />
        <span className="text-2xl font-bold text-purple-600">#{coin.item.market_cap_rank || 'N/A'}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2">{coin.item.name}</h3>
      <p className="text-gray-600 mb-2">{coin.item.symbol}</p>
      <p className="text-gray-800 mb-2">
        Price: ${coin.priceData.current_price?.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8,
        }) || 'N/A'}
      </p>
      <p className={`mb-2 ${coin.priceData.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        24h: {coin.priceData.price_change_24h.toFixed(2)}%
      </p>
      <p className={`mb-2 ${coin.priceData.price_change_1h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        1h: {coin.priceData.price_change_1h.toFixed(2) || 'N/A'}%
      </p>
      <div className="mt-4">
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
        <p className="text-gray-500 text-sm">
          Note: The data for these coins is provided by CoinGecko, meaning the trending coins displayed here are the ones most searched on CoinGecko in the last 3 hours.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {trendingCoins.map((coin) => (
          <CoinCard key={coin.item.id} coin={coin} />
        ))}
      </div>
    </div>
  );
}

export default TrendingPage;
