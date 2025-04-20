import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, Clock, CheckCircle, XCircle, AlertTriangle, Trophy, Wallet } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const UpOrDown = () => {
  // Core game state
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1');
  const [chartSymbol, setChartSymbol] = useState('BTCUSDT');
  const [coinPrices, setCoinPrices] = useState({});
  
  // Wallet state
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  
  // Game state
  const [gameState, setGameState] = useState('idle'); // idle, predicting, won, lost
  const [prediction, setPrediction] = useState(null);
  const [initialPrice, setInitialPrice] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);
  const [countdown, setCountdown] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ wins: 0, losses: 0 });
  const [chartLoaded, setChartLoaded] = useState(false);
  
  // Refs
  const countdownInterval = useRef(null);
  const tradingViewContainer = useRef(null);
  
  // Crypto mapping - updated with correct data and icon URLs
  const cryptoMapping = {
    'BTC': { 
      symbol: 'BTCUSDT', 
      name: 'Bitcoin', 
      coingeckoId: 'bitcoin',
      iconUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
    },
    'ETH': { 
      symbol: 'ETHUSDT', 
      name: 'Ethereum', 
      coingeckoId: 'ethereum',
      iconUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
    },
    'SOL': { 
      symbol: 'SOLUSDT', 
      name: 'Solana', 
      coingeckoId: 'solana',
      iconUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png'
    },
    'XRP': { 
      symbol: 'XRPUSDT', 
      name: 'Ripple', 
      coingeckoId: 'ripple',
      iconUrl: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'
    },
    'POL': { 
      symbol: 'MATICUSDT', 
      name: 'Polygon', 
      coingeckoId: 'matic-network',
      iconUrl: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png'
    }
  };
  
  // Timeframe options
  const timeframeOptions = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
  ];

  // Modify TradingView script loading function
  const loadTradingViewScript = () => {
    if (window.TradingView) {
      console.log('TradingView already loaded, initializing widget...');
      initializeTradingViewWidget();
      return;
    }
    
    console.log('Loading TradingView script...');
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      console.log('TradingView script loaded successfully');
      initializeTradingViewWidget();
    };
    script.onerror = (error) => {
      console.error('Error loading TradingView script:', error);
      toast.error('Failed to load chart. Please refresh the page.');
    };
    document.head.appendChild(script);
  };

  // Modify TradingView widget initialization
  const initializeTradingViewWidget = () => {
    try {
      console.log('Initializing TradingView widget...');
      if (!window.TradingView) {
        console.error('TradingView not available yet. Retrying in 1s...');
        setTimeout(initializeTradingViewWidget, 1000);
        return;
      }
      
      // Check if we should use tradingViewContainer ref or the new container
      if (tradingViewContainer.current) {
        console.log('Using ref container for TradingView widget');
        // Clear the ref container
        tradingViewContainer.current.innerHTML = '';
        
        // Create widget container in ref
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'tradingview_widget';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';
        tradingViewContainer.current.appendChild(widgetContainer);
        
        new window.TradingView.widget({
          autosize: true,
          symbol: chartSymbol,
          interval: timeframe,
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: "tradingview_widget",
          studies: ["RSI@tv-basicstudies"],
        });
        
        setChartLoaded(true);
        console.log('TradingView widget initialized in ref container');
      }
    } catch (error) {
      console.error('Error initializing TradingView widget:', error);
      toast.error('Error loading chart. Please refresh the page.');
    }
  };

  // Modify useEffect for wallet connection event handling
  useEffect(() => {
    // Listen for wallet connection events
    const handleWalletConnected = (event) => {
      console.log('Wallet connected event received:', event.detail);
      setIsWalletConnected(true);
      const storedPublicKey = localStorage.getItem('walletPublicKey');
      if (storedPublicKey) {
        setWalletAddress(storedPublicKey);
      }
      
      // Load saved stats
      const savedStats = localStorage.getItem('upordownStats');
      if (savedStats) {
        try {
          setStats(JSON.parse(savedStats));
        } catch (error) {
          console.error('Error parsing saved stats:', error);
        }
      }
      
      // Reload TradingView after small delay to ensure DOM is ready
      setTimeout(() => {
        loadTradingViewScript();
      }, 500);
      
      // Reload coin prices
      fetchAllPrices();
    };

    const handleWalletDisconnected = () => {
      console.log('Wallet disconnected event received');
      setIsWalletConnected(false);
      setWalletAddress(null);
      setGameState('idle');
      localStorage.removeItem('ongoingGame');
    };

    // Add event listeners
    window.addEventListener('walletConnected', handleWalletConnected);
    window.addEventListener('walletDisconnected', handleWalletDisconnected);

    // Check if wallet is already connected
    const isWalletConnected = localStorage.getItem('walletConnected') === 'true';
    if (isWalletConnected) {
      console.log('Wallet already connected, initializing...');
      setIsWalletConnected(true);
      
      // Get wallet address
      const storedPublicKey = localStorage.getItem('walletPublicKey');
      if (storedPublicKey) {
        setWalletAddress(storedPublicKey);
      }
      
      // Load saved stats
      const savedStats = localStorage.getItem('upordownStats');
      if (savedStats) {
        try {
          setStats(JSON.parse(savedStats));
        } catch (error) {
          console.error('Error parsing saved stats:', error);
        }
      }
      
      // Check for ongoing game
      const ongoingGame = localStorage.getItem('ongoingGame');
      if (ongoingGame) {
        try {
          const game = JSON.parse(ongoingGame);
          setSelectedCrypto(game.crypto);
          setChartSymbol(cryptoMapping[game.crypto].symbol);
          setPrediction(game.prediction);
          setInitialPrice(game.initialPrice);
          setGameState('predicting');
          
          // Calculate remaining time
          const elapsedTime = Math.floor((Date.now() - game.startTime) / 1000);
          const remainingTime = Math.max(0, 300 - elapsedTime);
          
          if (remainingTime > 0) {
            setCountdown(remainingTime);
            startCountdown(remainingTime);
          } else {
            // Game should have ended
            checkGameResult(game.crypto, game.prediction, game.initialPrice);
          }
        } catch (error) {
          console.error('Error parsing ongoing game data:', error);
          localStorage.removeItem('ongoingGame');
        }
      }
      
      // Load TradingView widget with a delay to ensure DOM is ready
      setTimeout(() => {
        loadTradingViewScript();
      }, 500);
    }

    return () => {
      // Remove event listeners
      window.removeEventListener('walletConnected', handleWalletConnected);
      window.removeEventListener('walletDisconnected', handleWalletDisconnected);
    };
  }, []);

  // Modify the useEffect for selectedCrypto changes
  useEffect(() => {
    if (selectedCrypto && isWalletConnected) {
      console.log(`Crypto changed to ${selectedCrypto}, reinitializing chart...`);
      // Update the chart symbol first
      setChartSymbol(cryptoMapping[selectedCrypto].symbol);
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        initializeTradingViewWidget();
      }, 300);
    }
  }, [selectedCrypto, timeframe]);
  
  // Fetch prices periodically
  useEffect(() => {
    fetchAllPrices();
    const pricesInterval = setInterval(fetchAllPrices, 15000);
    
    return () => {
      clearInterval(pricesInterval);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);
  
  // Handle crypto selection change
  const handleCryptoChange = (crypto) => {
    if (gameState === 'predicting') return; // Don't allow changes during prediction
    setSelectedCrypto(crypto);
    setChartSymbol(cryptoMapping[crypto].symbol);
  };
  
  // Handle timeframe selection change
  const handleTimeframeChange = (tf) => {
    if (gameState === 'predicting') return; // Don't allow changes during prediction
    setTimeframe(tf);
  };
  
  // Fetch all crypto prices
  const fetchAllPrices = async () => {
    try {
      const coinIds = Object.values(cryptoMapping).map(coin => coin.coingeckoId).join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&precision=4`
      );
      setCoinPrices(response.data);
    } catch (error) {
      console.error('Error fetching all prices:', error);
    }
  };
  
  // Fetch single crypto price
  const fetchPrice = async (crypto) => {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoMapping[crypto].coingeckoId}&vs_currencies=usd&precision=4`
      );
      return response.data[cryptoMapping[crypto].coingeckoId]?.usd;
    } catch (error) {
      console.error(`Error fetching ${crypto} price:`, error);
      return null;
    }
  };
  
  // Start game countdown
  const startCountdown = (startTime = 300) => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1;
        
        // Update ongoing game in localStorage
        const ongoingGame = JSON.parse(localStorage.getItem('ongoingGame') || '{}');
        if (ongoingGame) {
          localStorage.setItem('ongoingGame', JSON.stringify({
            ...ongoingGame,
            remainingTime: newCount
          }));
        }
        
        if (newCount <= 0) {
          clearInterval(countdownInterval.current);
          checkGameResult(selectedCrypto, prediction, initialPrice);
          return 0;
        }
        return newCount;
      });
    }, 1000);
  };
  
  // Make prediction (up/down)
  const makePrediction = async (direction) => {
    if (!isWalletConnected) {
      alert("Please connect your wallet to play!");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const currentPrice = await fetchPrice(selectedCrypto);
      
      if (!currentPrice) {
        throw new Error("Couldn't fetch current price. Please try again.");
      }
      
      setInitialPrice(currentPrice);
      setPrediction(direction);
      setGameState('predicting');
      setCountdown(300);
      
      // Store game in localStorage
      const gameData = {
        crypto: selectedCrypto,
        prediction: direction,
        initialPrice: currentPrice,
        startTime: Date.now(),
        walletAddress: walletAddress,
        remainingTime: 300
      };
      
      localStorage.setItem('ongoingGame', JSON.stringify(gameData));
      
      // Start countdown
      startCountdown();
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Error starting game: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check game result
  const checkGameResult = async (crypto, userPrediction, startPrice) => {
    setIsLoading(true);
    
    try {
      const endPrice = await fetchPrice(crypto);
      setFinalPrice(endPrice);
      
      let gameWon = false;
      
      if (userPrediction === 'up' && endPrice > startPrice) {
        gameWon = true;
      } else if (userPrediction === 'down' && endPrice < startPrice) {
        gameWon = true;
      }
      
      // Update stats
      const newStats = { ...stats };
      if (gameWon) {
        newStats.wins += 1;
        setGameState('won');
      } else {
        newStats.losses += 1;
        setGameState('lost');
      }
      
      setStats(newStats);
      localStorage.setItem('upordownStats', JSON.stringify(newStats));
      
      // Clear ongoing game
      localStorage.removeItem('ongoingGame');
    } catch (error) {
      console.error("Error checking game result:", error);
      alert("Error checking result: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset the game
  const resetGame = () => {
    setPrediction(null);
    setInitialPrice(null);
    setFinalPrice(null);
    setGameState('idle');
    setCountdown(300);
    
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    localStorage.removeItem('ongoingGame');
  };
  
  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Format price with currency symbol
  const formatPrice = (price) => {
    if (!price) return '$0.0000';
    return `$${parseFloat(price).toFixed(4)}`;
  };
  
  // Format percentage
  const formatPercentage = (current, previous) => {
    if (!current || !previous) return "0.00%";
    const percentage = ((current - previous) / previous) * 100;
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };
  
  // Helper function to get price for a crypto
  const getPriceForCrypto = (crypto) => {
    const coinInfo = cryptoMapping[crypto];
    if (!coinInfo) return null;
    
    return coinPrices[coinInfo.coingeckoId]?.usd;
  };
  
  return (
    <div className="w-full h-screen bg-gray-900 text-white overflow-y-auto">
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">
            KryptoScreener Prediction Game
          </h1>
          <p className="text-purple-200 mt-2">
            Predict whether your chosen crypto will go UP or DOWN in the next 5 minutes.
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!isWalletConnected ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-8 rounded-lg text-center max-w-xl mx-auto mt-8">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-yellow-600" />
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet to Play</h2>
            <p className="mb-6 text-yellow-700">
              The UP/DOWN prediction game requires a connected wallet to track your predictions and stats.
              Please connect your wallet from the top-right corner of the screen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
            {/* Left sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Trophy size={18} className="text-yellow-500 mr-2" />
                  Your Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <span className="block text-sm text-green-800 font-medium">Wins</span>
                    <span className="block text-2xl font-bold text-green-600">{stats.wins}</span>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <span className="block text-sm text-red-800 font-medium">Losses</span>
                    <span className="block text-2xl font-bold text-red-600">{stats.losses}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Win Rate</span>
                    <span className="font-medium">
                      {stats.wins + stats.losses > 0 
                        ? `${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%` 
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Coin selection */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Cryptocurrency</h3>
                <div className="space-y-2">
                  {Object.keys(cryptoMapping).map((crypto) => {
                    const coinInfo = cryptoMapping[crypto];
                    const price = getPriceForCrypto(crypto);
                    
                    return (
                      <div 
                        key={crypto}
                        onClick={() => handleCryptoChange(crypto)}
                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${
                          gameState === 'predicting' ? 'opacity-60 cursor-not-allowed' : ''
                        } ${
                          selectedCrypto === crypto
                            ? 'bg-purple-50 border-2 border-purple-500'
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <img 
                            src={coinInfo.iconUrl} 
                            alt={crypto} 
                            className="w-8 h-8 rounded-full mr-3"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/32/7c3aed/ffffff?text=' + crypto.charAt(0);
                            }}
                          />
                          <div>
                            <span className="block font-medium text-gray-800">{crypto}</span>
                            <span className="block text-xs text-gray-500">{coinInfo.name}</span>
                          </div>
                        </div>
                        {price && (
                          <div className="text-right">
                            <div className="font-medium text-gray-800">{formatPrice(price)}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Chart timeframe */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Chart Timeframe</h3>
                <div className="grid grid-cols-3 gap-2">
                  {timeframeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleTimeframeChange(option.value)}
                      disabled={gameState === 'predicting'}
                      className={`py-2 px-1 rounded-md text-sm transition-colors ${
                        timeframe === option.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${gameState === 'predicting' ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-3 space-y-6">
              {/* TradingView chart */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-1 relative">
                <div 
                  ref={tradingViewContainer}
                  className="w-full h-[500px] flex items-center justify-center"
                >
                  {!chartLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-10 w-10 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-600">Loading chart...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Game controls */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                {gameState === 'idle' ? (
                  <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
                      Predict: Will {selectedCrypto} price go UP or DOWN in the next 5 minutes?
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      <button
                        onClick={() => makePrediction('up')}
                        disabled={isLoading}
                        className="group bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-lg flex-1 flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 shadow-md"
                      >
                        <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
                          <ArrowUp size={24} />
                        </div>
                        <span className="text-lg">UP</span>
                      </button>
                      <button
                        onClick={() => makePrediction('down')}
                        disabled={isLoading}
                        className="group bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-lg flex-1 flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 shadow-md"
                      >
                        <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
                          <ArrowDown size={24} />
                        </div>
                        <span className="text-lg">DOWN</span>
                      </button>
                    </div>
                    {isLoading && (
                      <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
                        <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Fetching current price...</span>
                      </div>
                    )}
                  </div>
                ) : gameState === 'predicting' ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-purple-50 w-full max-w-xl rounded-xl p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Clock className="h-5 w-5 text-purple-600" />
                          </div>
                          <span className="text-lg font-semibold text-purple-800">Prediction in Progress</span>
                        </div>
                        <div className="bg-purple-600 text-white py-1 px-3 rounded-full text-sm font-medium">
                          {formatTime(countdown)}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-sm text-gray-500">Your Prediction</div>
                          <div className={`py-1 px-3 rounded-full text-sm font-medium ${
                            prediction === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {prediction === 'up' ? 'UP ↑' : 'DOWN ↓'}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">Starting Price</div>
                          <div className="font-medium">{formatPrice(initialPrice)}</div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">Current Price</div>
                            <div className="font-medium">
                              {getPriceForCrypto(selectedCrypto)
                                ? formatPrice(getPriceForCrypto(selectedCrypto))
                                : '-'
                              }
                            </div>
                          </div>
                          
                          {getPriceForCrypto(selectedCrypto) && (
                            <div className="flex justify-end mt-1">
                              <div className={`text-xs py-1 px-2 rounded-full ${
                                getPriceForCrypto(selectedCrypto) > initialPrice
                                  ? 'bg-green-100 text-green-800'
                                  : getPriceForCrypto(selectedCrypto) < initialPrice
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {formatPercentage(
                                  getPriceForCrypto(selectedCrypto),
                                  initialPrice
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm text-purple-700">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Your prediction will be evaluated in {formatTime(countdown)}. Please wait for the result.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                      gameState === 'won' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {gameState === 'won' ? (
                        <CheckCircle size={40} className="text-green-600" />
                      ) : (
                        <XCircle size={40} className="text-red-600" />
                      )}
                    </div>
                    
                    <h2 className={`text-2xl font-bold mb-6 ${
                      gameState === 'won' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {gameState === 'won' ? 'You Won!' : 'You Lost!'}
                    </h2>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-md shadow-sm">
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Your Prediction</div>
                          <div className={`inline-block py-1 px-3 rounded-full text-sm font-medium ${
                            prediction === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {prediction === 'up' ? 'UP ↑' : 'DOWN ↓'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Actual Movement</div>
                          <div className={`inline-block py-1 px-3 rounded-full text-sm font-medium ${
                            finalPrice > initialPrice ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {finalPrice > initialPrice ? 'UP ↑' : 'DOWN ↓'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Initial Price</div>
                          <div className="font-medium text-gray-800">{formatPrice(initialPrice)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Final Price</div>
                          <div className="font-medium text-gray-800">{formatPrice(finalPrice)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Price Change</div>
                        <div className="flex items-center justify-between">
                          <div className={`font-medium ${
                            finalPrice > initialPrice ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPrice(finalPrice - initialPrice)}
                          </div>
                          <div className={`text-sm py-1 px-2 rounded-full ${
                            finalPrice > initialPrice ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {formatPercentage(finalPrice, initialPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={resetGame}
                      className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpOrDown; 