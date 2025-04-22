import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCoinChart } from '../services/api';

function CoinDetailsModal({ coin, onClose, currency = 'usd', currencySymbol = '$' }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data = await getCoinChart(coin.id, 7, currency);
        const formattedData = data.prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toLocaleDateString(),
          price: price,
        }));
        setChartData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setLoading(false);
      }
    };

    fetchChartData();
  }, [coin.id, currency]);

  // Calculate the percentage position for the price range bar
  const priceRangePercentage = ((coin.current_price - coin.low_24h) / (coin.high_24h - coin.low_24h)) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header Layout */}
        <div className="flex justify-between mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <img src={coin.image} alt={coin.name} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{coin.name} 
                <span className="ml-1 sm:ml-2 text-purple-600 text-sm sm:text-base md:text-lg">{coin.symbol.toUpperCase()}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold">{currencySymbol}{coin.current_price.toLocaleString()}</span>
              <span className={`text-sm sm:text-base md:text-lg font-semibold ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {coin.price_change_percentage_24h?.toFixed(2)}%
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 h-fit"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Market Cap and Volume */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-6">
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-500">Market Cap</p>
            <p className="text-base sm:text-lg md:text-xl font-semibold">{currencySymbol}{coin.market_cap.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-500">Total Volume</p>
            <p className="text-base sm:text-lg md:text-xl font-semibold">{currencySymbol}{coin.total_volume.toLocaleString()}</p>
          </div>
        </div>

        {/* 24h Range with Visual Bar */}
        <div className="mb-4 sm:mb-8">
          <div className="flex justify-between mb-1 sm:mb-2 text-xs sm:text-sm">
            <span className="text-gray-500">24h Low: {currencySymbol}{coin.low_24h.toLocaleString()}</span>
            <span className="text-gray-500">24h High: {currencySymbol}{coin.high_24h.toLocaleString()}</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${priceRangePercentage}%` }}
            />
          </div>
        </div>

        {/* Price Graph */}
        <div className="mb-4 sm:mb-8 bg-gray-50 p-2 sm:p-4 rounded-lg">
          {loading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-700 mx-auto"></div>
              <p className="mt-2 sm:mt-4 text-sm sm:text-base">Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250} className="mt-2">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => window.innerWidth < 640 ? value.split('/')[1] : value}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => `${currencySymbol}${value.toLocaleString()}`} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8884d8" 
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Market Cap Rank and Circulation Supply */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-500">Market Cap Rank</p>
            <p className="text-base sm:text-lg md:text-xl font-semibold">#{coin.market_cap_rank}</p>
          </div>
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-500">Circulating Supply</p>
            <p className="text-base sm:text-lg md:text-xl font-semibold">{coin.circulating_supply?.toLocaleString() || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoinDetailsModal;