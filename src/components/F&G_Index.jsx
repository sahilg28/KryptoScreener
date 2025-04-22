import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { TrendingUp, BarChart2, ArrowUp, ArrowDown, Star, DollarSign, Activity, CircleDollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

function F_G_Index() {
  const [fngData, setFngData] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API configuration
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const formatLargeNumber = (value) => {
    if (!value || value === 0) return '0.00';
    
    if (value >= 1e12) {
      return `${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    }
    return value.toFixed(2);
  };

  // Cache management
  const getCachedData = () => {
    try {
      const cachedFng = localStorage.getItem('fngData');
      const cachedMarket = localStorage.getItem('marketData');
      const cachedTimestamp = localStorage.getItem('marketDataTimestamp');
      const cachedTrending = localStorage.getItem('trendingCoins');
      
      if (!cachedFng || !cachedMarket || !cachedTimestamp) return null;

      const isStale = (Date.now() - parseInt(cachedTimestamp)) > CACHE_DURATION;
      return {
        fngData: JSON.parse(cachedFng),
        marketData: JSON.parse(cachedMarket),
        trendingCoins: cachedTrending ? JSON.parse(cachedTrending) : [],
        isStale
      };
    } catch (error) {
      console.error('Cache reading error:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      const cachedResult = getCachedData();
      if (cachedResult) {
        setFngData(cachedResult.fngData);
        setMarketData(cachedResult.marketData);
        if (cachedResult.trendingCoins.length) {
          setTrendingCoins(cachedResult.trendingCoins);
        }
        setLoading(false);
        if (!cachedResult.isStale) {
          setError(null);
          return;
        }
      }

      const fetchWithRetry = async (retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
        try {
          // Fetch Fear & Greed and Market Data
          const [fngResponse, marketResponse, trendingResponse] = await Promise.all([
            axios.get('https://api.alternative.me/fng/', { timeout: 5000 }),
            axios.get('https://api.coingecko.com/api/v3/global', { timeout: 5000 }),
            axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 5000 })
          ]);

          if (fngResponse.data.data && fngResponse.data.data.length > 0) {
            const newFngData = fngResponse.data.data[0];
            setFngData(newFngData);
            localStorage.setItem('fngData', JSON.stringify(newFngData));
          }

          if (marketResponse.data.data) {
            const newMarketData = {
              totalMarketCap: marketResponse.data.data.total_market_cap.usd,
              totalVolume: marketResponse.data.data.total_volume.usd,
              marketCapChangePercentage24h: marketResponse.data.data.market_cap_change_percentage_24h_usd,
              volumeChangePercentage24h: marketResponse.data.data.volume_24h_change_24h
            };
            setMarketData(newMarketData);
            localStorage.setItem('marketData', JSON.stringify(newMarketData));
            localStorage.setItem('marketDataTimestamp', Date.now().toString());
          }

          if (trendingResponse.data && trendingResponse.data.coins) {
            const top10TrendingCoins = trendingResponse.data.coins.slice(0, 10);
            
            // Fetch additional data for trending coins
            const coinIds = top10TrendingCoins.map(coin => coin.item.id).join(',');
            const priceResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
              params: {
                vs_currency: 'usd',
                ids: coinIds,
                order: 'market_cap_desc',
                per_page: 10,
                page: 1,
                sparkline: false,
                price_change_percentage: '1h,24h'
              },
              timeout: 5000
            });

            const enrichedCoins = top10TrendingCoins.map(coin => {
              const priceData = priceResponse.data.find(p => p.id === coin.item.id) || {};
              return {
                ...coin,
                priceData: {
                  current_price: priceData.current_price || 'N/A',
                  price_change_24h: priceData.price_change_percentage_24h || 0,
                  price_change_1h: priceData.price_change_percentage_1h_in_currency || 0
                }
              };
            });

            setTrendingCoins(enrichedCoins);
            localStorage.setItem('trendingCoins', JSON.stringify(enrichedCoins));
          }

          setError(null);
        } catch (err) {
          console.error('Error fetching data:', err);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(retries - 1, delay * 2);
          }
          throw err;
        }
      };

      try {
        await fetchWithRetry();
      } catch (err) {
        const errorMessage = err.code === 'ECONNABORTED' 
          ? 'Request timeout. Please check your internet connection.'
          : err.response?.status === 429
          ? 'Rate limit exceeded. Please try again in a few minutes.'
          : 'Failed to load market data. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 300000);

    return () => clearInterval(interval);
  }, []);

  const getColorClass = (value) => {
    const numValue = parseInt(value);
    if (numValue <= 25) return 'bg-red-500';
    if (numValue <= 45) return 'bg-orange-500';
    if (numValue <= 55) return 'bg-yellow-500';
    if (numValue <= 75) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getGradientStyle = (value) => {
    const numValue = parseInt(value);
    const colors = [
      { value: 0, color: '#ef4444' },   // Extreme Fear (Red)
      { value: 25, color: '#f97316' },  // Fear (Orange)
      { value: 45, color: '#eab308' },  // Neutral (Yellow)
      { value: 55, color: '#84cc16' },  // Greed (Lime)
      { value: 75, color: '#22c55e' },  // Extreme Greed (Green)
      { value: 100, color: '#22c55e' }  // End color
    ];

    // Create gradient stops
    const gradientStops = colors.map(stop => `${stop.color} ${stop.value}%`).join(', ');

    return {
      background: `conic-gradient(from 180deg, ${gradientStops})`,
    };
  };

  const getArrowRotation = (value) => {
    const numValue = parseInt(value);
    return {
      transform: `rotate(${(numValue * 1.8) - 90}deg)`, // 1.8 degrees per value (180/100)
      transformOrigin: 'center',
      transition: 'transform 0.5s ease-in-out'
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-pulse">
        <div className="bg-white rounded-lg shadow h-44"></div>
        <div className="bg-white rounded-lg shadow h-44 md:col-span-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (!fngData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Fear & Greed Index Card */}
      <div className="md:col-span-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="p-3 border-b bg-purple-50">
          <div className="flex justify-between items-center">
            <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center">
              <Activity size={18} className="text-purple-600 mr-2" />
              Fear & Greed Index
            </h2>
            <a 
              href="https://alternative.me/crypto/fear-and-greed-index/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-800 flex items-center"
            >
              <span className="hidden sm:inline mr-1">Data:</span> alternative.me
            </a>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-3 group">
            {/* Meter background */}
            <div 
              className="w-full h-full rounded-full flex items-center justify-center border-2 border-gray-100 overflow-hidden"
              style={getGradientStyle(fngData.value)}
              data-tooltip-id="meter-tooltip"
              data-tooltip-content={`Current Index: ${fngData.value} - ${fngData.value_classification}`}
            >
              {/* Center display */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-full transform scale-[0.85]">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-800">{fngData.value}</div>
                  <div className="text-[10px] sm:text-sm text-gray-600 capitalize">{fngData.value_classification}</div>
                </div>
              </div>
            </div>
            
            {/* Indicator arrow */}
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6"
              style={getArrowRotation(fngData.value)}
            >
              <div className="w-0 h-0 
                border-l-[8px] border-l-transparent 
                border-r-[8px] border-r-transparent 
                border-b-[12px] border-b-red-500 
                mx-auto">
              </div>
            </div>
          </div>
          
          <div className="w-full px-2 py-2">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <span className="mr-2">Updated:</span>
              {new Date(fngData.timestamp * 1000).toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Market Stats Card */}
      <div className="md:col-span-5 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="p-3 border-b bg-purple-50">
          <div className="flex justify-between items-center">
            <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center">
              <CircleDollarSign size={18} className="text-purple-600 mr-2" />
              Market Overview
            </h2>
          </div>
        </div>
        
        <div className="p-4">
          {marketData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg transform transition-all hover:scale-[1.02]">
                <div className="flex items-center mb-1">
                  <DollarSign size={16} className="text-purple-600 mr-1" />
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Market Cap</div>
                </div>
                <div className="text-lg sm:text-xl font-bold flex items-center gap-1.5">
                  ${formatLargeNumber(marketData.totalMarketCap)}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    marketData.marketCapChangePercentage24h >= 0 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {marketData.marketCapChangePercentage24h >= 0 ? '+' : ''}
                    {marketData.marketCapChangePercentage24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg transform transition-all hover:scale-[1.02]">
                <div className="flex items-center mb-1">
                  <BarChart2 size={16} className="text-purple-600 mr-1" />
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">24h Trading Volume</div>
                </div>
                <div className="text-lg sm:text-xl font-bold flex items-center gap-1.5">
                  ${formatLargeNumber(marketData.totalVolume)}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    marketData.volumeChangePercentage24h >= 0 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {marketData.volumeChangePercentage24h >= 0 ? '+' : ''}
                    {Math.abs(marketData.volumeChangePercentage24h || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="sm:col-span-2 bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <div className="text-xs sm:text-sm text-gray-700 font-medium">Market Sentiment</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${fngData.value < 50 ? 'text-red-600' : 'text-green-600'} text-xs sm:text-sm font-medium`}>
                    {fngData.value < 50 ? (
                      <ArrowDown size={16} className="mr-1" />
                    ) : (
                      <ArrowUp size={16} className="mr-1" />
                    )}
                    {fngData.value < 20 ? 'Extreme Fear - Strong Buy Signal' : 
                     fngData.value < 40 ? 'Fear - Potential Buy Opportunity' : 
                     fngData.value < 60 ? 'Neutral Market Sentiment' : 
                     fngData.value < 80 ? 'Greed - Caution Advised' : 
                     'Extreme Greed - Potential Reversal Coming'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            </div>
          )}
        </div>
      </div>

      {/* Trending Coins Card */}
      <div className="md:col-span-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="p-3 border-b bg-purple-50">
          <div className="flex justify-between items-center">
            <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center">
              <TrendingUp size={18} className="text-purple-600 mr-2" />
              Trending Coins
            </h2>
            <Link to="/trending" className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-800 font-medium">
              View All →
            </Link>
          </div>
        </div>
        
        <div className="max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          {trendingCoins.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {trendingCoins.slice(0, 5).map((coin, index) => (
                <div key={index} className="p-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold text-purple-700">
                      {index + 1}
                    </div>
                    <img src={coin.item.small} alt={coin.item.name} className="w-5 h-5" />
                    <div className="flex flex-col">
                      <div className="text-xs sm:text-sm font-medium">{coin.item.symbol}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[80px]">{coin.item.name}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs sm:text-sm font-medium">
                      ${typeof coin.priceData.current_price === 'number' 
                        ? coin.priceData.current_price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6
                          })
                        : 'N/A'}
                    </div>
                    <div className={`text-[10px] ${coin.priceData.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {coin.priceData.price_change_24h >= 0 ? '↑' : '↓'} 
                      {Math.abs(coin.priceData.price_change_24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
            </div>
          )}
        </div>
      </div>
      <Tooltip id="meter-tooltip" />
    </div>
  );
}

export default F_G_Index;