import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCoinChart, getTopCoins } from '../services/api';

const ChartingSection = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coinName, setCoinName] = useState('');

  useEffect(() => {
    const fetchTopCoinChart = async () => {
      try {
        const topCoins = await getTopCoins(1, 1);
        const topCoin = topCoins[0];
        setCoinName(topCoin.name);
        
        const data = await getCoinChart(topCoin.id);
        const formattedData = data.prices.map((item) => ({
          date: new Date(item[0]).toLocaleDateString(),
          price: item[1],
        }));
        setChartData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setLoading(false);
      }
    };

    fetchTopCoinChart();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center mb-12">Advanced Charting Tools</h2>
        {loading ? (
          <p className="text-center">Loading chart data...</p>
        ) : (
          <div className="bg-purple-100 p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-center">{coinName} Price Chart (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-center text-gray-700">
              Explore our advanced charting tools to analyze cryptocurrency performance, compare multiple coins, and view historical data with ease.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChartingSection;