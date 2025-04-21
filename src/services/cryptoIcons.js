/**
 * Service for fetching cryptocurrency icons from CoinGecko
 */

// Map of cryptocurrency symbols to their CoinGecko IDs
const COIN_GECKO_IDS = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'POL': 'polygon'  // Matic/Polygon
};

// Default fallback icons - base64 encoded or URLs
const FALLBACK_ICONS = {
  'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png',
  'POL': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png'
};

/**
 * Get the CoinGecko ID for a cryptocurrency symbol
 * @param {string} symbol - Cryptocurrency symbol (e.g., 'BTC')
 * @returns {string|null} CoinGecko ID or null if not found
 */
export const getCoinGeckoId = (symbol) => {
  return COIN_GECKO_IDS[symbol] || null;
};

/**
 * Get the icon URL for a cryptocurrency
 * @param {string} symbol - Cryptocurrency symbol (e.g., 'BTC')
 * @returns {string} Icon URL
 */
export const getCryptoIconUrl = (symbol) => {
  // Return fallback icon if available
  return FALLBACK_ICONS[symbol] || 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png';
};

/**
 * Fetch crypto data from CoinGecko API for a specific crypto
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {Promise<Object>} Cryptocurrency data
 */
export const fetchCryptoData = async (symbol) => {
  const id = getCoinGeckoId(symbol);
  
  if (!id) {
    return { 
      price: null,
      icon: getCryptoIconUrl(symbol)
    };
  }
  
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      price: data.market_data?.current_price?.usd,
      icon: data.image?.small || getCryptoIconUrl(symbol),
      name: data.name,
      symbol: data.symbol.toUpperCase()
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    
    return { 
      price: null,
      icon: getCryptoIconUrl(symbol)
    };
  }
};

/**
 * Fetch data for multiple cryptocurrencies
 * @param {string[]} symbols - Array of cryptocurrency symbols
 * @returns {Promise<Object>} Object with cryptocurrency data keyed by symbol
 */
export const fetchMultipleCryptoData = async (symbols) => {
  try {
    const symbolsString = symbols
      .map(sym => getCoinGeckoId(sym))
      .filter(id => id) // Filter out null values
      .join(',');
    
    if (!symbolsString) {
      return symbols.reduce((acc, symbol) => {
        acc[symbol] = { icon: getCryptoIconUrl(symbol) };
        return acc;
      }, {});
    }
    
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${symbolsString}&order=market_cap_desc&per_page=${symbols.length}&page=1&sparkline=false`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const result = symbols.reduce((acc, symbol) => {
      const id = getCoinGeckoId(symbol);
      const coinData = data.find(coin => coin.id === id);
      
      if (coinData) {
        acc[symbol] = {
          price: coinData.current_price,
          icon: coinData.image || getCryptoIconUrl(symbol),
          name: coinData.name,
          symbol: coinData.symbol.toUpperCase()
        };
      } else {
        acc[symbol] = {
          price: null,
          icon: getCryptoIconUrl(symbol)
        };
      }
      
      return acc;
    }, {});
    
    return result;
  } catch (error) {
    console.error('Error fetching multiple crypto data:', error);
    
    // Return fallback data
    return symbols.reduce((acc, symbol) => {
      acc[symbol] = { icon: getCryptoIconUrl(symbol) };
      return acc;
    }, {});
  }
}; 