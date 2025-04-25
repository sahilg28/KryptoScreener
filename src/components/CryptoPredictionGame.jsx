import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, Clock, Trophy, Wallet, Info, BarChart, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import useBinanceSocket from '../hooks/useBinanceSocket';
import confetti from 'canvas-confetti';
import { selectIsWalletConnected, selectWalletPublicKey } from '../store/slices/walletSlice';
import TradingViewWidget from './TradingViewWidget';
import { getCryptoIconUrl, fetchMultipleCryptoData } from '../services/cryptoIcons';

// Supported cryptocurrencies
const CRYPTO_OPTIONS = [
  { symbol: 'BTC', name: 'Bitcoin', tradingViewSymbol: 'BTCUSDT' },
  { symbol: 'ETH', name: 'Ethereum', tradingViewSymbol: 'ETHUSDT' },
  { symbol: 'SOL', name: 'Solana', tradingViewSymbol: 'SOLUSDT' },
  { symbol: 'BNB', name: 'Binance Coin', tradingViewSymbol: 'BNBUSDT' },
  { symbol: 'POL', name: 'Polygon (Matic)', tradingViewSymbol: 'POLUSDT' }
];

// Time slots for predictions
const TIME_SLOTS = [
  { value: 1, label: '1 Min', seconds: 60 },
  { value: 3, label: '3 Min', seconds: 180 },
  { value: 5, label: '5 Min', seconds: 300 },
  { value: 10, label: '10 Min', seconds: 600 }
];

const CryptoPredictionGame = () => {
  // Game state
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [timeSlot, setTimeSlot] = useState(1); // Default to 1 minute
  const [gameState, setGameState] = useState('idle'); // idle, predicting, won, lost
  const [prediction, setPrediction] = useState(null); // 'up' or 'down'
  const [initialPrice, setInitialPrice] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);
  const [countdown, setCountdown] = useState(60); // Default to 1 minute (60 seconds)
  const [isLoading, setIsLoading] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [stats, setStats] = useState({ wins: 0, losses: 0 });
  const [cryptoIcons, setCryptoIcons] = useState({});
  
  // Wallet state from Redux
  const isWalletConnected = useSelector(selectIsWalletConnected);
  const walletAddress = useSelector(selectWalletPublicKey);
  
  // Price change state
  const [priceChange, setPriceChange] = useState(0);
  
  // Selected trading pair details
  const selectedPair = CRYPTO_OPTIONS.find(crypto => crypto.symbol === selectedCrypto);
  
  // Refs
  const countdownInterval = useRef(null);
  const chartContainerRef = useRef(null);
  const gameEndTimeRef = useRef(null);
  
  // WebSocket connection
  const { 
    price: currentPrice, 
    formattedPrice, 
    isPriceUp, 
    isPriceDown, 
    isConnected 
  } = useBinanceSocket(selectedCrypto.toLowerCase());
  
  // Ensure we capture the wallet address separately to handle disconnections
  const [savedWalletAddress, setSavedWalletAddress] = useState(null);
  
  // Load crypto icons on mount
  useEffect(() => {
    const loadCryptoIcons = async () => {
      try {
        const symbols = CRYPTO_OPTIONS.map(crypto => crypto.symbol);
        const iconsData = await fetchMultipleCryptoData(symbols);
        setCryptoIcons(iconsData);
      } catch (error) {
        console.error('Failed to load crypto icons:', error);
        // Set fallback icons
        const fallbackIcons = CRYPTO_OPTIONS.reduce((acc, crypto) => {
          acc[crypto.symbol] = { icon: getCryptoIconUrl(crypto.symbol) };
          return acc;
        }, {});
        setCryptoIcons(fallbackIcons);
      }
    };
    
    loadCryptoIcons();
  }, []);
  
  // Check for wallet connection on mount and when Redux state changes
  useEffect(() => {
    if (isWalletConnected && walletAddress) {
      setSavedWalletAddress(walletAddress); // Save the wallet address for later use
      
      // Load saved stats
      try {
        const statsKey = `kryptoPredictStats_${walletAddress}`;
        const savedStats = localStorage.getItem(statsKey);
        if (savedStats) {
          console.log('Loading saved stats for wallet:', { walletAddress, stats: JSON.parse(savedStats) });
          setStats(JSON.parse(savedStats));
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
      
      // Check for ongoing game
      try {
        const ongoingGame = localStorage.getItem('ongoingGame');
        if (ongoingGame) {
          const gameData = JSON.parse(ongoingGame);
          resumeOngoingGame(gameData);
        }
      } catch (error) {
        console.error('Error loading ongoing game:', error);
      }
    }
    
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, [isWalletConnected, walletAddress]);
  
  // Update price change when in active prediction
  useEffect(() => {
    if (gameState === 'predicting' && initialPrice && currentPrice) {
      const priceChangePercent = ((currentPrice - initialPrice) / initialPrice) * 100;
      setPriceChange(priceChangePercent);
    }
  }, [currentPrice, initialPrice, gameState]);
  
  // Handle wallet disconnection via custom event
  useEffect(() => {
    const handleWalletDisconnected = () => {
      resetGame();
      localStorage.removeItem('ongoingGame');
    };
    
    window.addEventListener('walletDisconnected', handleWalletDisconnected);
    
    return () => {
      window.removeEventListener('walletDisconnected', handleWalletDisconnected);
    };
  }, []);

  // Handle game end when timer reaches 0
  useEffect(() => {
    if (countdown === 0 && isGameActive) {
      finishGame();
    }
  }, [countdown, isGameActive]);
  
  // Resume an ongoing game from localStorage
  const resumeOngoingGame = (gameData) => {
    if (!gameData || !gameData.crypto || !gameData.prediction || !gameData.initialPrice) {
      return;
    }
    
    try {
      console.log('Resuming game:', gameData);
      setSelectedCrypto(gameData.crypto);
      setPrediction(gameData.prediction);
      setInitialPrice(gameData.initialPrice);
      setGameState('predicting');
      setIsGameActive(true);
      
      // Calculate remaining time
      const now = Date.now();
      const endTime = gameData.endTime || (gameData.startTime + (gameData.timeSlot * 60 * 1000));
      const remainingTime = Math.max(0, Math.floor((endTime - now) / 1000));
      const timeSlotValue = gameData.timeSlot || 1;
      
      setTimeSlot(timeSlotValue);
      gameEndTimeRef.current = endTime;
      
      if (remainingTime > 0) {
        setCountdown(remainingTime);
        startCountdown(remainingTime);
      } else {
        // If game should have ended already
        finishGame();
      }
    } catch (error) {
      console.error('Error in resumeOngoingGame:', error);
      resetGame();
    }
  };
  
  // Handle crypto selection change
  const handleCryptoChange = (crypto) => {
    if (gameState === 'predicting') {
      toast.error('Cannot change cryptocurrency during an active prediction!');
      return;
    }
    setSelectedCrypto(crypto);
  };
  
  // Handle time slot changes
  const handleTimeSlotChange = (value) => {
    if (gameState === 'predicting') {
      toast.error('Cannot change time during an active prediction!');
      return;
    }
    const newTimeSlot = parseInt(value, 10);
    setTimeSlot(newTimeSlot);
    setCountdown(newTimeSlot * 60);
  };

  // Handle wallet connection request
  const handleConnectWallet = () => {
    window.dispatchEvent(new CustomEvent('requestWalletConnect'));
  };
  
  // Start countdown timer
  const startCountdown = (seconds) => {
    setCountdown(seconds);
    
    // Clear any existing interval
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    
    // Set the absolute end time for synchronization
    const endTime = Date.now() + (seconds * 1000);
    gameEndTimeRef.current = endTime;
    
    // Start a new interval that checks the actual time remaining
    countdownInterval.current = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((gameEndTimeRef.current - now) / 1000));
      
      setCountdown(timeLeft);
      
      // Update remaining time in localStorage
      try {
        const ongoingGame = JSON.parse(localStorage.getItem('ongoingGame') || '{}');
        if (ongoingGame && ongoingGame.crypto) {
          localStorage.setItem('ongoingGame', JSON.stringify({
            ...ongoingGame,
            remainingTime: timeLeft
          }));
        }
      } catch (error) {
        console.error('Error updating countdown in localStorage:', error);
      }
      
      // Stop interval if countdown reaches 0
      if (timeLeft <= 0) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    }, 1000);
  };
  
  // Make prediction
  const makePrediction = (direction) => {
    if (!isWalletConnected) {
      handleConnectWallet();
      return;
    }
    
    if (isGameActive) {
      toast.error('You already have an active prediction!');
      return;
    }
    
    // Check if we have live price data
    if (!isConnected || !currentPrice) {
      toast.error('Cannot start prediction without live price data. Please wait for connection to be established.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      setInitialPrice(currentPrice);
      setPrediction(direction);
      setGameState('predicting');
      setIsGameActive(true);
      
      const now = Date.now();
      const seconds = timeSlot * 60;
      const endTime = now + (seconds * 1000);
      
      // Save this for synchronization
      gameEndTimeRef.current = endTime;
      
      // Save game state to local storage
      localStorage.setItem('ongoingGame', JSON.stringify({
        crypto: selectedCrypto,
        timeSlot: timeSlot,
        prediction: direction,
        initialPrice: currentPrice,
        startTime: now,
        endTime: endTime
      }));
      
      // Toast notification
      toast.success(`${direction === 'up' ? '📈 UP' : '📉 DOWN'} prediction started!`);
      
      // Start countdown
      startCountdown(seconds);
      
    } catch (error) {
      console.error('Error starting prediction:', error);
      toast.error('Failed to start prediction. Try again.');
      resetGame();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Finish the game
  const finishGame = () => {
    // Don't proceed if game is not active or missing initial data
    if (!isGameActive || !initialPrice) {
      console.log('Cannot finish game: game not active or missing initial price');
      resetGame();
      return;
    }

    // Don't proceed if we don't have current live price data
    if (!currentPrice) {
      console.log('Cannot finish game: no current price available');
      toast.error('Unable to determine game outcome - no live price data available. Try again later.');
      resetGame();
      return;
    }

    try {
      console.log('Finishing game with state:', { initialPrice, prediction, currentPrice });
      
      // First mark the game as not active to prevent any race conditions
      setIsGameActive(false);
      
      // Store final price in state
      setFinalPrice(currentPrice);
      
      // Calculate price change & determine outcome
      const priceChange = ((currentPrice - initialPrice) / initialPrice) * 100;
      const priceWentUp = currentPrice > initialPrice;
      const won = (prediction === 'up' && priceWentUp) || (prediction === 'down' && !priceWentUp);
      
      // Update game state to 'won' or 'lost'
      setGameState(won ? 'won' : 'lost');
      
      // Update stats
      const newStats = { 
        wins: (stats.wins || 0) + (won ? 1 : 0),
        losses: (stats.losses || 0) + (won ? 0 : 1)
      };
      
      // Update stats state
      setStats(newStats);
      
      // Clear ongoing game from storage
      localStorage.removeItem('ongoingGame');
      
      // Save updated stats to localStorage with wallet key
      const addressToUse = walletAddress || savedWalletAddress;
      if (addressToUse) {
        const statsKey = `kryptoPredictStats_${addressToUse}`;
        console.log('Saving stats to localStorage:', { statsKey, newStats });
        localStorage.setItem(statsKey, JSON.stringify(newStats));
      }
      
      // Show notification
      toast.success(
        won 
          ? `🎉 You were right! ${selectedCrypto} went ${prediction.toUpperCase()}!` 
          : `😔 Not this time. ${selectedCrypto} went ${prediction === 'up' ? 'DOWN' : 'UP'}.`
      );
      
      // Show confetti for wins
      if (won) {
        loadConfetti();
      }
      
    } catch (error) {
      console.error('Error finishing game:', error);
      toast.error('Error determining game outcome');
      resetGame();
    }
  };
  
  // Reset game state
  const resetGame = () => {
    console.log('Resetting game state');
    setGameState('idle');
    setPrediction(null);
    setInitialPrice(null);
    setFinalPrice(null);
    setIsGameActive(false);
    setPriceChange(0);
    
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };
  
  // Load confetti animation
  const loadConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Error showing confetti:', error);
    }
  };

  // Format time remaining as MM:SS
  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render component UI
  return (
    <div className="flex flex-col bg-gradient-to-b from-purple-50 to-gray-50 p-4 sm:p-6 rounded-xl shadow-md">
      {/* Title and Instructions */}
      <div className="mb-4 p-4 rounded-lg bg-white shadow-sm border border-purple-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            <h3 className="text-base sm:text-lg font-semibold">Your Stats:</h3>
            <span className="text-green-600 font-medium text-sm sm:text-base">{stats.wins} Wins</span>
            <span className="mx-1">|</span>
            <span className="text-red-600 font-medium text-sm sm:text-base">{stats.losses} Losses</span>
          </div>
          
          {!isWalletConnected && (
            <button 
              onClick={handleConnectWallet} 
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors"
            >
              <Wallet size={16} />
              Connect Wallet to Save Progress
            </button>
          )}
        </div>
      </div>
      
      {/* Crypto Selection and Trading Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        {/* Crypto Selection */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center text-purple-800">
            <BarChart size={18} className="mr-2 text-purple-600" />
            Select Crypto
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {CRYPTO_OPTIONS.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => handleCryptoChange(crypto.symbol)}
                className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                  selectedCrypto === crypto.symbol
                    ? 'bg-purple-100 border-purple-500 border text-purple-800 shadow-sm transform scale-105'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:scale-[1.02]'
                }`}
                disabled={gameState === 'predicting'}
              >
                <img 
                  src={cryptoIcons[crypto.symbol]?.icon || getCryptoIconUrl(crypto.symbol)} 
                  alt={crypto.name} 
                  className="w-6 h-6 mr-2"
                />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-xs sm:text-sm">{crypto.symbol}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500">{crypto.name}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center text-purple-800">
              <Clock size={18} className="mr-2 text-purple-600" />
              Prediction Time
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.value}
                  onClick={() => handleTimeSlotChange(slot.value)}
                  className={`px-3 py-2 rounded-lg text-center text-xs sm:text-sm transition-all duration-300 ${
                    timeSlot === slot.value
                      ? 'bg-purple-100 border-purple-500 border text-purple-800 shadow-sm transform scale-105'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:scale-[1.02]'
                  }`}
                  disabled={gameState === 'predicting'}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="lg:col-span-3 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-purple-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4">
            <div className="flex items-center mb-2 sm:mb-0">
              <h3 className="text-base sm:text-lg font-semibold mr-2">{selectedPair.name} Chart</h3>
              <div className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <div className="text-lg sm:text-xl font-semibold">
                {formattedPrice}
              </div>
              {gameState === 'predicting' && (
                <div className={`text-sm font-semibold ${
                  priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(3)}%
                </div>
              )}
            </div>
          </div>
          
          {!isConnected && (
            <div className="flex items-center justify-center p-4 bg-red-50 text-red-600 rounded-lg mb-4">
              <AlertCircle size={18} className="mr-2" />
              <span>Waiting for live price data. Please wait...</span>
            </div>
          )}
          
          {/* Chart */}
          <div ref={chartContainerRef} className="h-[300px] sm:h-[400px]">
            <TradingViewWidget symbol={selectedPair.tradingViewSymbol} />
          </div>
        </div>
      </div>
      
      {/* Game Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
        {gameState === 'idle' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => makePrediction('up')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 sm:py-4 rounded-lg text-sm sm:text-base font-semibold transition-all"
              disabled={isLoading || !isConnected || !currentPrice}
            >
              <ArrowUp size={24} className="" />
              {isLoading ? 'Loading...' : 'Price Will Go UP!'}
            </button>
            <button
              onClick={() => makePrediction('down')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 sm:py-4 rounded-lg text-sm sm:text-base font-semibold transition-all "
              disabled={isLoading || !isConnected || !currentPrice}
            >
              <ArrowDown size={24} className="" />
              {isLoading ? 'Loading...' : 'Price Will Go DOWN!'}
            </button>
          </div>
        )}
        
        {gameState === 'predicting' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 text-sm sm:text-base text-gray-600">
              Your prediction: Price will go 
              <span className={`font-bold ${prediction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {' '}{prediction === 'up' ? 'UP' : 'DOWN'}{' '}
              </span>
              from ${initialPrice?.toFixed(2)}
            </div>
            
            <div className="text-3xl sm:text-4xl font-bold my-2 text-purple-800">
              {formatTimeRemaining(countdown)}
            </div>
            
            <div className="w-full max-w-md bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-700 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${(countdown / (timeSlot * 60)) * 100}%` }} 
              ></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md p-4 bg-gray-50 rounded-lg mt-2 shadow-inner">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-sm sm:text-base text-gray-500">Initial:</span>
                <span className="font-medium">
                  ${typeof initialPrice === 'number' ? initialPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: initialPrice > 1000 ? 2 : 6
                  }) : '0.00'}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-sm sm:text-base text-gray-500">Current:</span>
                <span className={`font-medium ${
                  currentPrice > initialPrice 
                    ? 'text-green-600' 
                    : currentPrice < initialPrice 
                    ? 'text-red-600' 
                    : ''
                }`}>
                  ${currentPrice ? currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: currentPrice > 1000 ? 2 : 6
                  }) : 'Waiting...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {(gameState === 'won' || gameState === 'lost') && (
          <div className="flex flex-col items-center text-center">
            <div className={`text-xl sm:text-2xl font-bold mb-4 ${
              gameState === 'won' ? 'text-green-600' : 'text-red-600'
            }`}>
              {gameState === 'won' ? '🎉 Prediction Correct! You Won!' : '😔 Prediction Incorrect. You Lost.'}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-6">
              <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
                <span className="text-xs sm:text-sm text-gray-500">Prediction</span>
                <span className={`font-medium ${
                  prediction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>{prediction === 'up' ? 'UP' : 'DOWN'}</span>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
                <span className="text-xs sm:text-sm text-gray-500">Initial Price</span>
                <span className="font-medium">
                  ${typeof initialPrice === 'number' ? initialPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: initialPrice > 1000 ? 2 : 6
                  }) : '0.00'}
                </span>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
                <span className="text-xs sm:text-sm text-gray-500">Final Price</span>
                <span className={`font-medium ${
                  finalPrice > initialPrice 
                    ? 'text-green-600' 
                    : finalPrice < initialPrice 
                    ? 'text-red-600' 
                    : 'text-gray-600'
                }`}>
                  ${typeof finalPrice === 'number' ? finalPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: finalPrice > 1000 ? 2 : 6
                  }) : '0.00'}
                </span>
              </div>
            </div>
            
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-all hover:shadow-lg transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      
      {/* Game Rules */}
      <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-purple-100 text-xs sm:text-sm text-gray-700">
        <div className="flex items-start gap-2">
          <Info size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="mb-2"><strong>How to play:</strong> Select a cryptocurrency and prediction time, then guess if the price will go UP or DOWN.</p>
            <p className="mb-2"><strong>Important:</strong> This is a fun game with no real cryptocurrency or money involved. It's just for testing your prediction skills!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoPredictionGame; 