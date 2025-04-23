import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Star, TrendingUp, BarChart2 } from 'lucide-react';
import { getTopCoins } from '../services/api';
import CoinDetailsModal from './CoinDetailsModal';
import PageBanner from './PageBanner';

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

        <div className="flex items-center gap-2 my-2 sm:my-0">
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
      <PageBanner 
        title="Track Real-Time Crypto Prices & Trends"
        description="Monitor cryptocurrency prices, market caps, and volume data updated in real-time from trusted sources"
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search 1000+ cryptocurrencies..."
              className="w-full p-2 pl-10 border border-gray-300 rounded bg-white"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <select
            value={currency}
            onChange={handleCurrencyChange}
            className="w-full sm:w-48 p-2 border border-gray-300 rounded bg-white"
          >
            {currencies.map(curr => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full">
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
            <div className="overflow-x-auto">
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coin
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        1h %
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        24h %
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        7d %
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Market Cap
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Volume(24h)
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Circulating Supply
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coins.length > 0 ? (
                      coins.map((coin, index) => (
                        <tr key={coin.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {searchTerm ? index + 1 : (page - 1) * COINS_PER_PAGE + index + 1}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span className="font-medium text-gray-900">{coin.symbol.toUpperCase()}</span>
                                <span className="text-xs text-gray-500 hidden sm:inline">{coin.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {renderPrice(coin.current_price)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-right hidden sm:table-cell">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg ${coin.price_change_percentage_1h_in_currency > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {coin.price_change_percentage_1h_in_currency ? coin.price_change_percentage_1h_in_currency.toFixed(2) : 0}%
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-right hidden sm:table-cell">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg ${coin.price_change_percentage_24h > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : 0}%
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-right hidden md:table-cell">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg ${
                              coin.price_change_percentage_7d_in_currency > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {coin.price_change_percentage_7d_in_currency ? coin.price_change_percentage_7d_in_currency.toFixed(2) : 0}%
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right hidden lg:table-cell">
                            {currentCurrency.symbol}{formatLargeNumber(coin.market_cap)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right hidden lg:table-cell">
                            {currentCurrency.symbol}{formatLargeNumber(coin.total_volume)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right hidden lg:table-cell">
                            {formatLargeNumber(coin.circulating_supply)} {coin.symbol.toUpperCase()}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-1 justify-center">
                              <button
                                onClick={() => setSelectedCoin(coin)}
                                className="p-1 text-gray-600 hover:text-purple-700 transition-colors"
                                aria-label={`View details for ${coin.name}`}
                              >
                                <BarChart2 size={18} />
                              </button>
                              {watchlist.includes(coin.id) ? (
                                <button
                                  onClick={() => removeFromWatchlist(coin.id)}
                                  className="p-1 text-yellow-500 hover:text-yellow-600 transition-colors"
                                  aria-label={`Remove ${coin.name} from watchlist`}
                                >
                                  <Star className="fill-current" size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => addToWatchlist(coin.id)}
                                  className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                                  aria-label={`Add ${coin.name} to watchlist`}
                                >
                                  <Star size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          No coins found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </div>
          )}
        </div>
      </div>
      {selectedCoin && <CoinDetailsModal coin={selectedCoin} onClose={() => setSelectedCoin(null)} />}
    </div>
  );
}

export default CryptoTable;
