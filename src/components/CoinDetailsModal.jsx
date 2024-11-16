import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCoinChart } from '../services/api';

function CoinDetailsModal({ coin, onClose, currency, currencySymbol }) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{coin.name} ({coin.symbol.toUpperCase()})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="font-semibold">Price:</p>
            <p>{currencySymbol}{coin.current_price.toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Market Cap:</p>
            <p>{currencySymbol}{coin.market_cap.toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">24h Volume:</p>
            <p>{currencySymbol}{coin.total_volume.toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">24h Change:</p>
            <p className={coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}>
              {coin.price_change_percentage_24h?.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Price Chart (Last 7 Days)</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
              <p className="mt-4">Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
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
      </div>
    </div>
  );
}

export default CoinDetailsModal;