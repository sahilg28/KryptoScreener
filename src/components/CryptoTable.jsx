import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Star, TrendingUp, BarChart2 } from 'lucide-react';
import { getTopCoins } from '../services/api';
import CoinDetailsModal from './CoinDetailsModal';

function CryptoTable({ watchlist, addToWatchlist, removeFromWatchlist }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState('usd');
  const [selectedCoin, setSelectedCoin] = useState(null);
  const COINS_PER_PAGE = 50;
  const [allCoins, setAllCoins] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalMarketCap: 0,
    totalVolume: 0,
    marketCapChangePercentage24h: 0,
    volumeChangePercentage24h: 0
  });

  useEffect(() => {
    const fetchAllCoinsForSearch = async () => {
      try {
        const promises = [1, 2, 3, 4, 5].map(page => 
          getTopCoins(page, 100, 'usd')
        );
        const results = await Promise.all(promises);
        const combinedCoins = results.flat();
        setAllCoins(combinedCoins);
      } catch (error) {
        console.error('Error fetching all coins:', error);
      }
    };

    fetchAllCoinsForSearch();
  }, []);

  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true);
      try {
        const batchNumber = Math.ceil(page / 2);
        const data = await getTopCoins(batchNumber, 100, currency.toLowerCase());
        
        const startIndex = ((page - 1) % 2) * 50;
        const endIndex = startIndex + 50;
        const paginatedCoins = data.slice(startIndex, endIndex);
        
        setCoins(paginatedCoins);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching coins:', error);
        setLoading(false);
      }
    };

    if (!searchTerm) {
      fetchCoins();
    }
  }, [page, currency, searchTerm]);

  useEffect(() => {
    if (searchTerm) {
      setLoading(true);
      const searchResults = allCoins.filter(coin =>
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setCoins(searchResults);
      setLoading(false);
    }
  }, [searchTerm, allCoins]);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        const data = await response.json();
        setGlobalStats({
          totalMarketCap: data.data.total_market_cap.usd,
          totalVolume: data.data.total_volume.usd,
          marketCapChangePercentage24h: data.data.market_cap_change_percentage_24h_usd,
          volumeChangePercentage24h: data.data.volume_24h_change_24h
        });
      } catch (error) {
        console.error('Error fetching global stats:', error);
      }
    };

    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const currencies = [
    { value: 'usd', label: 'USD ($)', symbol: '$' },
    { value: 'inr', label: 'INR (₹)', symbol: '₹' },
    { value: 'eur', label: 'EUR (€)', symbol: '€' },
    { value: 'aed', label: 'AED (د.إ)', symbol: 'د.إ' },
    { value: 'cad', label: 'CAD (C$)', symbol: 'C$' },
  ];

  const currentCurrency = currencies.find(c => c.value === currency) || currencies[0];

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
    setPage(1);
  };

  const totalPages = searchTerm ? Math.ceil(coins.length / COINS_PER_PAGE) : 20;

  const renderPagination = () => {
    if (searchTerm) return null;

    return (
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPage(1)} 
            disabled={page === 1}
            className="btn-primary flex items-center disabled:opacity-50"
          >
            First
          </button>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1} 
            className="btn-primary flex items-center disabled:opacity-50"
          >
            <ChevronLeft size={20} className="mr-2" /> Previous
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Page</span>
          <select 
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[...Array(totalPages)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <span className="text-sm">of {totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages}
            className="btn-primary flex items-center disabled:opacity-50"
          >
            Next <ChevronRight size={20} className="ml-2" />
          </button>
          <button 
            onClick={() => setPage(totalPages)} 
            disabled={page === totalPages}
            className="btn-primary flex items-center disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

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

  const convertPrice = (priceInUSD, targetCurrency) => {
    const conversionRates = {
      'usd': 1,
      'inr': 83.12,
      'eur': 0.92,
      'aed': 3.67,
      'cad': 1.35
    };
    
    if (currency === 'usd') return priceInUSD;
    return priceInUSD * conversionRates[targetCurrency];
  };

  const renderPrice = (price) => {
    if (!price) return `${currentCurrency.symbol}0.00`;
    const convertedPrice = convertPrice(price, currency);
    return `${currentCurrency.symbol}${Number(convertedPrice).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="section-title text-2xl font-semibold text-center mb-4">Explore the World of Cryptocurrencies</h2>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2 text-sm md:text-base">
            <TrendingUp size={20} className="text-purple-600" />
            <span className="font-medium">Market Cap:</span>
            <span className="font-bold">
              ${formatLargeNumber(globalStats.totalMarketCap)}
            </span>
            <span className={`ml-2 ${globalStats.marketCapChangePercentage24h >= 0 
              ? 'text-green-600' 
              : 'text-red-600'}`}
            >
              {globalStats.marketCapChangePercentage24h >= 0 ? '+' : ''}
              {globalStats.marketCapChangePercentage24h?.toFixed(2) || '0.00'}%
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm md:text-base">
            <BarChart2 size={20} className="text-purple-600" />
            <span className="font-medium">24h Volume:</span>
            <span className="font-bold">
              ${formatLargeNumber(globalStats.totalVolume)}
            </span>
            <span className={`ml-2 ${globalStats.volumeChangePercentage24h >= 0 
              ? 'text-green-600' 
              : 'text-red-600'}`}
            >
              {globalStats.volumeChangePercentage24h >= 0 ? '+' : ''}
              {globalStats.volumeChangePercentage24h?.toFixed(2) || '0.00'}%
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search in 1000 cryptocurrencies..."
              className="w-full p-2 pl-10 border border-gray-300 rounded"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <select
            value={currency}
            onChange={handleCurrencyChange}
            className="w-full md:w-auto p-2 border border-gray-300 rounded"
          >
            {currencies.map(curr => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!allCoins.length && !loading && (
        <div className="text-center py-4 text-gray-500">
          Loading coin database...
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
          <p className="mt-4">Loading cryptocurrencies...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-purple-100">
                  <th className="px-4 py-2 text-left">Rank</th>
                  <th className="px-4 py-2 text-left">Coin</th>
                  <th className="px-4 py-2 text-right">Price ({currentCurrency.symbol})</th>
                  <th className="px-4 py-2 text-right">24h %</th>
                  <th className="px-4 py-2 text-right">Market Cap ({currentCurrency.symbol})</th>
                  <th className="px-4 py-2 text-center">Watchlist</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin, index) => (
                  <tr key={coin.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 text-left">
                      {searchTerm ? coin.market_cap_rank : (page - 1) * 50 + index + 1}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center cursor-pointer" onClick={() => setSelectedCoin(coin)}>
                        <img src={coin.image} alt={coin.name} className="w-6 h-6 mr-2" />
                        <span>{coin.name}</span>
                        <span className="ml-2 text-gray-500 uppercase">{coin.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {renderPrice(coin.current_price)}
                    </td>
                    <td className={`px-4 py-2 text-right ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right">
                      {renderPrice(coin.market_cap)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => watchlist.includes(coin.id) ? removeFromWatchlist(coin.id) : addToWatchlist(coin.id)}>
                        <Star 
                          size={20} 
                          className={watchlist.includes(coin.id) ? "text-yellow-500 fill-current" : "text-gray-400"} 
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}
      {selectedCoin && (
        <CoinDetailsModal 
          coin={selectedCoin} 
          onClose={() => setSelectedCoin(null)} 
          currency={currency}
          currencySymbol={currentCurrency.symbol}
        />
      )}
    </div>
  );
}

export default CryptoTable;