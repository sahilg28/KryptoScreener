/**
 * Binance WebSocket API service
 * Provides functions for creating WebSocket connections to Binance API
 * and utilities for formatting price data
 */

// Base WebSocket URL for Binance
const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

// Connection state constants
export const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

// Map of common trading pairs
export const TRADING_PAIRS = {
  btc: 'btcusdt',
  eth: 'ethusdt',
  sol: 'solusdt',
  ada: 'adausdt',
  dot: 'dotusdt',
  doge: 'dogeusdt',
  avax: 'avaxusdt',
  link: 'linkusdt',
  matic: 'maticusdt',
  bnb: 'bnbusdt',
};

// Crypto mapping
export const cryptoMapping = {
  BTC: { symbol: 'BTCUSDT', name: 'Bitcoin' },
  ETH: { symbol: 'ETHUSDT', name: 'Ethereum' },
  SOL: { symbol: 'SOLUSDT', name: 'Solana' },
  ADA: { symbol: 'ADAUSDT', name: 'Cardano' },
  DOT: { symbol: 'DOTUSDT', name: 'Polkadot' },
};

/**
 * Creates a WebSocket connection to Binance stream for a specific trading pair
 * @param {string} symbol - Trading pair symbol (e.g., 'btcusdt')
 * @returns {WebSocket} - WebSocket connection
 */
export const createSocket = (symbol) => {
  try {
    const socket = new WebSocket(`${BINANCE_WS_BASE}/${symbol}@trade`);
    
    socket.onopen = () => {
      console.log(`WebSocket connection established for ${symbol}`);
    };
    
    socket.onerror = (error) => {
      console.error(`WebSocket error for ${symbol}:`, error);
    };
    
    socket.onclose = () => {
      console.log(`WebSocket connection closed for ${symbol}`);
    };
    
    return socket;
  } catch (error) {
    console.error(`Failed to create WebSocket for ${symbol}:`, error);
    
    // Return a mock WebSocket object that won't crash the app
    return {
      onopen: () => {},
      onmessage: () => {},
      onerror: () => {},
      onclose: () => {},
      close: () => {},
      readyState: 3, // CLOSED
      send: () => {}
    };
  }
};

/**
 * Formats a price value with appropriate precision based on the value range
 * @param {number} price - Price to format
 * @returns {string} - Formatted price
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '—';
  
  const numPrice = parseFloat(price);
  
  if (numPrice >= 1000) {
    return numPrice.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 2 
    });
  } else if (numPrice >= 1) {
    return numPrice.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 4 
    });
  } else if (numPrice >= 0.0001) {
    return numPrice.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 6 
    });
  } else {
    return numPrice.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 8 
    });
  }
};

/**
 * Formats a percentage change value with appropriate sign and precision
 * @param {number} percentage - Percentage value to format
 * @returns {string} - Formatted percentage with sign
 */
export const formatPercentage = (percentage) => {
  if (percentage === null || percentage === undefined) return '—';
  
  const numPercentage = parseFloat(percentage);
  const sign = numPercentage >= 0 ? '+' : '';
  
  return `${sign}${numPercentage.toFixed(2)}%`;
};

/**
 * Formats a percentage with color classes for Tailwind CSS
 * @param {number} percentage - Percentage value
 * @returns {object} - Object with formatted value and color class
 */
export const formatPercentageWithColor = (percentage) => {
  if (percentage === null || percentage === undefined) {
    return { value: '—', colorClass: 'text-gray-500' };
  }
  
  const numPercentage = parseFloat(percentage);
  const sign = numPercentage >= 0 ? '+' : '';
  const value = `${sign}${numPercentage.toFixed(2)}%`;
  
  let colorClass = 'text-gray-500'; // default
  
  if (numPercentage > 0) {
    colorClass = 'text-green-500';
  } else if (numPercentage < 0) {
    colorClass = 'text-red-500';
  }
  
  return { value, colorClass };
};

/**
 * Safely closes a WebSocket connection
 * @param {WebSocket} socket - The WebSocket connection to close
 */
export const closeSocket = (socket) => {
  if (!socket) return;
  
  try {
    // Remove all event listeners to prevent memory leaks
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    
    if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error('Error closing WebSocket:', error);
  }
};

/**
 * Starts a heartbeat mechanism to keep the connection alive
 * @param {WebSocket} socket - The WebSocket connection
 * @param {number} [interval=30000] - Heartbeat interval in milliseconds
 * @returns {number} Interval ID for cleanup
 */
export const startHeartbeat = (socket, interval = 30000) => {
  if (!socket) return null;
  
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({ method: 'PING' }));
      } catch (error) {
        console.error('Error sending heartbeat:', error);
        stopHeartbeat(pingInterval);
      }
    } else if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
      // Stop heartbeat if socket is closed or closing
      stopHeartbeat(pingInterval);
    }
  }, interval);
  
  return pingInterval;
};

/**
 * Stops the heartbeat mechanism
 * @param {number} intervalId - The interval ID from startHeartbeat
 */
export const stopHeartbeat = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

/**
 * Validates WebSocket message data
 * @param {Object} data - The parsed WebSocket message data
 * @param {string} streamType - Stream type ('ticker' or 'trade')
 * @returns {boolean} Whether the data is valid
 */
export const validateMessageData = (data, streamType) => {
  if (!data) return false;
  
  try {
    if (streamType === 'ticker') {
      // Ticker data should have 'c' (close price)
      return data.hasOwnProperty('c') && !isNaN(parseFloat(data.c));
    } else if (streamType === 'trade') {
      // Trade data should have 'p' (price)
      return data.hasOwnProperty('p') && !isNaN(parseFloat(data.p));
    }
    return false;
  } catch (error) {
    console.error('Error validating WebSocket data:', error);
    return false;
  }
};

/**
 * Extracts price data from different stream types
 * @param {Object} data - The parsed WebSocket message data
 * @param {string} [streamType='ticker'] - Stream type ('ticker' or 'trade')
 * @returns {number|null} The extracted price or null if not found
 */
export const extractPrice = (data, streamType = 'ticker') => {
  if (!data) return null;
  
  try {
    if (!validateMessageData(data, streamType)) {
      return null;
    }
    
    if (streamType === 'ticker') {
      return parseFloat(data.c); // Last price from ticker
    } else if (streamType === 'trade') {
      return parseFloat(data.p); // Price from trade
    }
    return null;
  } catch (error) {
    console.error('Error extracting price from WebSocket data:', error);
    return null;
  }
};

/**
 * Gets the display name for a trading pair
 * @param {string} symbol - Trading pair symbol (e.g., 'btcusdt')
 * @returns {string} Human-readable name for the trading pair
 */
export const getPairName = (symbol) => {
  if (!symbol) return 'Unknown';
  
  const lowerSymbol = symbol.toLowerCase();
  return TRADING_PAIRS[lowerSymbol] || symbol.toUpperCase();
};

/**
 * Reconnects a WebSocket with exponential backoff
 * @param {Function} connectFn - Function to create new WebSocket
 * @param {number} [retryCount=0] - Current retry count
 * @param {number} [maxRetries=5] - Maximum number of retries
 * @param {number} [baseDelay=1000] - Base delay in milliseconds
 * @param {number} [maxDelay=30000] - Maximum delay between retries
 * @returns {Promise<WebSocket>} Promise resolving to new WebSocket
 */
export const reconnectWithBackoff = async (connectFn, retryCount = 0, maxRetries = 5, baseDelay = 1000, maxDelay = 30000) => {
  if (retryCount >= maxRetries) {
    throw new Error(`Failed to connect after ${maxRetries} attempts`);
  }
  
  // Calculate delay with jitter to prevent all clients reconnecting simultaneously
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
  const delay = Math.min(exponentialDelay + jitter, maxDelay);
  
  console.log(`Reconnecting attempt ${retryCount + 1}/${maxRetries} after ${Math.round(delay)}ms`);
  
  // Wait for the calculated delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  try {
    return connectFn();
  } catch (error) {
    console.error(`Reconnection attempt ${retryCount + 1} failed:`, error);
    // Try again with incremented retry count
    return reconnectWithBackoff(connectFn, retryCount + 1, maxRetries, baseDelay, maxDelay);
  }
};

/**
 * Creates a WebSocket connection to Binance for a specific cryptocurrency
 * @param {string} crypto - The cryptocurrency symbol (e.g., BTC, ETH)
 * @param {Function} onPriceUpdate - Callback for price updates
 * @param {Function} onConnectionChange - Callback for connection status changes
 * @returns {Object} - WebSocket control methods
 */
export const createBinanceSocketForCrypto = (
  crypto, 
  onPriceUpdate = () => {}, 
  onConnectionChange = () => {}
) => {
  const symbol = cryptoMapping[crypto]?.symbol || `${crypto}USDT`;
  let socket = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let isConnected = false;
  let lastPrice = null;
  let pulsePriceUp = false;
  let pulsePriceDown = false;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_MS = 3000;
  
  // Create WebSocket connection
  const connect = () => {
    // Clear any existing reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // If socket exists and is open, close it first
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
    }
    
    try {
      // Create new WebSocket connection to Binance
      socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
      
      // Set up event handlers
      socket.onopen = handleOpen;
      socket.onmessage = handleMessage;
      socket.onerror = handleError;
      socket.onclose = handleClose;
    } catch (error) {
      console.error(`Error creating WebSocket for ${symbol}:`, error);
      scheduleReconnect();
    }
    
    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  };
  
  // Handle WebSocket open event
  const handleOpen = () => {
    console.log(`Connected to Binance WebSocket for ${symbol}`);
    isConnected = true;
    reconnectAttempts = 0;
    onConnectionChange(true);
  };
  
  // Handle WebSocket message event
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Extract price from ticker data
      if (data && data.c) {
        const currentPrice = parseFloat(data.c);
        
        // Determine if price went up or down for animation purposes
        if (lastPrice !== null) {
          pulsePriceUp = currentPrice > lastPrice;
          pulsePriceDown = currentPrice < lastPrice;
          
          // Reset pulse after a short delay
          setTimeout(() => {
            pulsePriceUp = false;
            pulsePriceDown = false;
            onPriceUpdate(currentPrice, pulsePriceUp, pulsePriceDown);
          }, 500);
        }
        
        lastPrice = currentPrice;
        onPriceUpdate(currentPrice, pulsePriceUp, pulsePriceDown);
      }
    } catch (error) {
      console.error(`Error parsing message from ${symbol} WebSocket:`, error);
    }
  };
  
  // Handle WebSocket error event
  const handleError = (error) => {
    console.error(`Error in ${symbol} WebSocket:`, error);
    if (isConnected) {
      isConnected = false;
      onConnectionChange(false);
    }
  };
  
  // Handle WebSocket close event
  const handleClose = (event) => {
    console.log(`${symbol} WebSocket connection closed:`, event.code, event.reason);
    
    if (isConnected) {
      isConnected = false;
      onConnectionChange(false);
    }
    
    // Schedule reconnect
    scheduleReconnect();
  };
  
  // Schedule reconnect attempt
  const scheduleReconnect = () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached for ${symbol}.`);
      return;
    }
    
    reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect for ${symbol} in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect to ${symbol} WebSocket...`);
      connect();
    }, delay);
  };
  
  // Force reconnect method (exposed to consumers)
  const forceReconnect = () => {
    console.log(`Force reconnecting ${symbol} WebSocket...`);
    reconnectAttempts = 0;
    connect();
  };
  
  // Start the initial connection
  connect();
  
  // Return public methods and properties
  return {
    get isConnected() { return isConnected; },
    get currentPrice() { return lastPrice; },
    get pulsePriceUp() { return pulsePriceUp; },
    get pulsePriceDown() { return pulsePriceDown; },
    forceReconnect
  };
}; 