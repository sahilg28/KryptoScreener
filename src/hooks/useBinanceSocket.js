import { useState, useEffect, useRef } from 'react';
import { createSocket, formatPrice, TRADING_PAIRS } from '../services/binanceSocket';

/**
 * Custom hook for managing Binance WebSocket connections
 * Provides real-time price data for a specified cryptocurrency
 * 
 * @param {string} cryptoSymbol - Symbol of the cryptocurrency (e.g., 'BTC', 'ETH')
 * @returns {object} - Object containing price data and connection status
 */
const useBinanceSocket = (cryptoSymbol) => {
  const [price, setPrice] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [isPriceUp, setIsPriceUp] = useState(false);
  const [isPriceDown, setIsPriceDown] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const socketRef = useRef(null);
  const timeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const symbolRef = useRef(cryptoSymbol);

  // Update the ref when symbol changes
  useEffect(() => {
    symbolRef.current = cryptoSymbol;
  }, [cryptoSymbol]);

  // Calculate max backoff time based on reconnect attempts (capped at 30 seconds)
  const getBackoffTime = (attempts) => {
    return Math.min(Math.pow(2, attempts) * 1000, 30000);
  };

  useEffect(() => {
    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Reset state
    setConnectionError(null);
    setIsPriceUp(false);
    setIsPriceDown(false);
    
    // Get the trading pair from our map or fallback to direct lowercase
    const tradingPair = TRADING_PAIRS[cryptoSymbol.toLowerCase()] || 
                       `${cryptoSymbol.toLowerCase()}usdt`;
    
    const connectSocket = () => {
      try {
        // Create a new WebSocket connection
        const socket = createSocket(tradingPair);
        socketRef.current = socket;
        
        // Handle WebSocket events
        socket.onopen = () => {
          console.log(`WebSocket connection opened for ${tradingPair}`);
          setIsConnected(true);
          setConnectionError(null);
          setReconnectAttempts(0);
        };
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.p) {
              setPrevPrice(price);
              const newPrice = parseFloat(data.p);
              setPrice(newPrice);
              
              // Determine if price went up or down
              if (price !== null) {
                if (newPrice > price) {
                  setIsPriceUp(true);
                  setIsPriceDown(false);
                } else if (newPrice < price) {
                  setIsPriceUp(false);
                  setIsPriceDown(true);
                }
                
                // Reset the price direction indicator after a short delay
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                  setIsPriceUp(false);
                  setIsPriceDown(false);
                }, 1000);
              }
            }
          } catch (error) {
            console.error(`Error processing WebSocket message for ${tradingPair}:`, error);
          }
        };
        
        socket.onerror = (error) => {
          console.error(`WebSocket error for ${tradingPair}:`, error);
          setIsConnected(false);
          setConnectionError(`Connection error: ${error.message || 'Unknown error'}`);
        };
        
        socket.onclose = (event) => {
          console.log(`WebSocket connection closed for ${tradingPair}, code: ${event.code}, reason: ${event.reason}`);
          setIsConnected(false);
          
          // Don't attempt to reconnect if this was a clean close (1000) or if component is unmounting
          if (event.code !== 1000) {
            const nextAttempt = reconnectAttempts + 1;
            setReconnectAttempts(nextAttempt);
            
            // Attempt to reconnect with exponential backoff
            const backoffTime = getBackoffTime(nextAttempt);
            console.log(`Reconnecting to ${tradingPair} in ${backoffTime}ms (attempt ${nextAttempt})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (socketRef.current === socket) { // Only reconnect if this socket is still current
                console.log(`Attempting to reconnect to ${tradingPair} (attempt ${nextAttempt})`);
                connectSocket();
              }
            }, backoffTime);
          }
        };
      } catch (error) {
        console.error(`Failed to create socket for ${tradingPair}:`, error);
        setIsConnected(false);
        setConnectionError(`Failed to connect: ${error.message || 'Unknown error'}`);
      }
    };
    
    // Initial connection
    connectSocket();
    
    // Clean up on unmount or when crypto symbol changes
    return () => {
      if (socketRef.current) {
        // Use code 1000 for clean close
        socketRef.current.close(1000, "Component unmounting");
        socketRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [cryptoSymbol]);
  
  // Format the price if available, otherwise return a placeholder
  const formattedPrice = price 
    ? formatPrice(price)
    : "Connecting...";
  
  return {
    price, // Return null when no price is available
    formattedPrice,
    prevPrice,
    isPriceUp,
    isPriceDown,
    isConnected,
    connectionError,
    reconnectAttempts,
    priceClass: isPriceUp ? 'text-green-500' : isPriceDown ? 'text-red-500' : 'text-gray-500'
  };
};

export default useBinanceSocket; 