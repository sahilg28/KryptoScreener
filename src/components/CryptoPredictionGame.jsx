import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, Clock, Trophy, Wallet, Info, BarChart } from 'lucide-react';
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
  
  // WebSocket connection
  const { 
    price: currentPrice, 
    formattedPrice, 
    isPriceUp, 
    isPriceDown, 
    isConnected 
  } = useBinanceSocket(selectedCrypto.toLowerCase());
  
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
      // Load saved stats
      try {
        const statsKey = `kryptoPredictStats_${walletAddress}`;
        const savedStats = localStorage.getItem(statsKey);
        if (savedStats) {
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
    } else {
      resetGame();
    }
    
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
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
      
      if (remainingTime > 0) {
        setCountdown(remainingTime);
        startCountdown(remainingTime);
      } else {
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
    setTimeSlot(parseInt(value, 10));
    setCountdown(parseInt(value, 10) * 60);
  };
  
  // Start countdown timer
  const startCountdown = (seconds) => {
    setCountdown(seconds);
    
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    countdownInterval.current = setInterval(() => {
      setCountdown(prevCountdown => {
        const newCountdown = prevCountdown - 1;
        
        // Update remaining time in localStorage
        const ongoingGame = JSON.parse(localStorage.getItem('ongoingGame') || '{}');
        if (ongoingGame && ongoingGame.crypto) {
          localStorage.setItem('ongoingGame', JSON.stringify({
            ...ongoingGame,
            remainingTime: newCountdown
          }));
        }
        
        if (newCountdown <= 0) {
          clearInterval(countdownInterval.current);
          finishGame();
          return 0;
        }
        
        return newCountdown;
      });
    }, 1000);
  };
  
  // Make prediction
  const makePrediction = (direction) => {
    if (!isWalletConnected) {
      window.dispatchEvent(new CustomEvent('requestWalletConnect'));
      return;
    }
    
    if (isGameActive) {
      toast.error('You already have an active prediction!');
      return;
    }
    
    // Use current price from Binance socket or fallback
    const currentPriceValue = currentPrice || 
                             (selectedCrypto === 'BTC' ? 35000 : 
                              selectedCrypto === 'ETH' ? 1900 : 
                              selectedCrypto === 'SOL' ? 140 : 
                              selectedCrypto === 'BNB' ? 560 : 
                              selectedCrypto === 'POL' ? 0.7 : 100);
    
    setIsLoading(true);
    
    try {
      setInitialPrice(currentPriceValue);
      setPrediction(direction);
      setGameState('predicting');
      setIsGameActive(true);
      
      const now = Date.now();
      const seconds = timeSlot * 60;
      
      // Save game state to local storage
      localStorage.setItem('ongoingGame', JSON.stringify({
        crypto: selectedCrypto,
        timeSlot: timeSlot,
        prediction: direction,
        initialPrice: currentPriceValue,
        startTime: now,
        endTime: now + (seconds * 1000)
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
    if (!isGameActive || !initialPrice || !prediction) {
      resetGame();
      return;
    }
    
    try {
      // Use current price from Binance socket or calculate a random outcome
      const finalPriceValue = currentPrice || (initialPrice * (1 + (Math.random() * 0.02 - 0.01)));
      
      setFinalPrice(finalPriceValue);
      
      // Calculate price change & determine outcome
      const priceChange = ((finalPriceValue - initialPrice) / initialPrice) * 100;
      const priceWentUp = finalPriceValue > initialPrice;
      const won = (prediction === 'up' && priceWentUp) || (prediction === 'down' && !priceWentUp);
      
      // Update game state to 'result' to show the result UI
      setGameState('result');
      
      // Clear ongoing game from storage
      localStorage.removeItem('ongoingGame');
      
      // Update stats
      let newStats = { ...stats };
      if (won) {
        newStats.wins = (stats.wins || 0) + 1;
        // Show confetti for wins
        loadConfetti();
      } else {
        newStats.losses = (stats.losses || 0) + 1;
      }
      
      setStats(newStats);
      
      // Save updated stats to localStorage if wallet is connected
      if (isWalletConnected && walletAddress) {
        const statsKey = `kryptoPredictStats_${walletAddress}`;
        localStorage.setItem(statsKey, JSON.stringify(newStats));
      }
      
      // Show notification
      toast.success(
        won 
          ? `🎉 You were right! ${selectedCrypto} went ${prediction.toUpperCase()}!` 
          : `😔 Not this time. ${selectedCrypto} went ${prediction === 'up' ? 'DOWN' : 'UP'}.`
      );
      
      // Keep the result displayed (don't automatically reset)
      setIsGameActive(false);
      
    } catch (error) {
      console.error('Error finishing game:', error);
      toast.error('Error determining game outcome');
      resetGame();
    }
  };
  
  // Reset game state
  const resetGame = () => {
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
  
  // Format price for display
  const formatPriceDisplay = (price) => {
    if (!price) return '0.00';
    
    if (price > 1000) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else if (price > 1) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else {
      return price.toLocaleString('en-US', { maximumFractionDigits: 4 });
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

  // Return wallet connect UI if not connected
  if (!isWalletConnected) {
    return (
      <div className="bg-gradient-to-b from-purple-800 to-purple-900 min-h-screen text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">PredictKrypto Game</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Predict whether the price of your chosen cryptocurrency will go UP or DOWN in the next few minutes. 
              Connect your Solana wallet to play and track your prediction history!
            </p>
          </div>
          
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Connect Your Wallet</h2>
            <p className="mb-6 text-gray-600">
              You need to connect your Solana wallet to play the prediction game.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('requestWalletConnect'))}
              className="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-purple-800 to-purple-900 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">PredictKrypto Game</h1>
          <p className="text-lg">
            Predict whether the price of your chosen cryptocurrency will go UP or DOWN in the next few 
            minutes. Connect your Solana wallet to play and track your prediction history!
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Crypto Selection */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="flex items-center text-lg font-semibold mb-4">
                <BarChart className="w-5 h-5 mr-2 text-purple-600" />
                Select Crypto Pair
              </h2>
              <div className="space-y-3">
                {CRYPTO_OPTIONS.map(crypto => (
                  <button
                    key={crypto.symbol}
                    onClick={() => handleCryptoChange(crypto.symbol)}
                    disabled={gameState === 'predicting'}
                    className={`w-full flex items-center p-3 rounded-lg transition-all ${
                      selectedCrypto === crypto.symbol
                        ? 'bg-purple-50 border-2 border-purple-300'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    } ${gameState === 'predicting' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-3 bg-gray-100 flex items-center justify-center">
                      {cryptoIcons[crypto.symbol] ? (
                        <img 
                          src={cryptoIcons[crypto.symbol].icon} 
                          alt={crypto.symbol} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">{crypto.symbol}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{crypto.symbol}/USDT</div>
                      <div className="text-xs text-gray-500">{crypto.name}</div>
                    </div>
                    <div className={`text-right ${
                      crypto.symbol === selectedCrypto && isPriceUp ? 'text-green-600' : 
                      crypto.symbol === selectedCrypto && isPriceDown ? 'text-red-600' : 
                      'text-gray-700'
                    }`}>
                      {crypto.symbol === selectedCrypto 
                        ? (currentPrice ? `$${formatPriceDisplay(currentPrice)}` : '-')
                        : (cryptoIcons[crypto.symbol]?.price ? `$${formatPriceDisplay(cryptoIcons[crypto.symbol].price)}` : '-')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Selection */}
            {!isGameActive && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="flex items-center text-lg font-semibold mb-4">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  Select Time Slot
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot.value}
                      onClick={() => handleTimeSlotChange(slot.value)}
                      disabled={gameState === 'predicting'}
                      className={`py-2 px-4 rounded-lg transition-all ${
                        timeSlot === slot.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      } ${gameState === 'predicting' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="flex items-center text-lg font-semibold mb-4">
                <Trophy className="w-5 h-5 mr-2 text-purple-600" />
                Game Stats
              </h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.wins || 0}</div>
                  <div className="text-sm text-green-700">Wins</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{stats.losses || 0}</div>
                  <div className="text-sm text-red-700">Losses</div>
                </div>
                <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Win Rate</div>
                  <div className="text-xl font-semibold text-purple-600">
                    {stats.wins + stats.losses > 0
                      ? `${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%`
                      : '0%'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Live Price */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="flex items-center text-lg font-semibold mb-4">
                <BarChart className="w-5 h-5 mr-2 text-purple-600" />
                Live Price
              </h2>
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  isPriceUp ? 'text-green-600' : 
                  isPriceDown ? 'text-red-600' : 
                  'text-gray-800'
                }`}>
                  {currentPrice ? `$${formatPriceDisplay(currentPrice)}` : '$0.00'}
                  
                  {/* Price movement indicator */}
                  <span className="inline-block ml-2">
                    {isPriceUp && <ArrowUp className="w-6 h-6 inline text-green-600" />}
                    {isPriceDown && <ArrowDown className="w-6 h-6 inline text-red-600" />}
                  </span>
                </div>
                
                {/* Add price change percentage when in active game */}
                {gameState === 'predicting' && initialPrice && currentPrice && (
                  <div className={`text-sm font-medium mt-1 ${
                    priceChange > 0 ? 'text-green-600' : 
                    priceChange < 0 ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </div>
                )}
                
                <div className="text-gray-500 mt-1 flex items-center justify-center">
                  <span className="font-medium">{selectedCrypto}/USDT</span>
                  {isConnected && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Live</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Trading View Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 h-[500px]" ref={chartContainerRef}>
              <h2 className="text-lg font-semibold mb-4">
                <span className="text-green-500">●</span> {selectedCrypto}/USDT Live Chart
              </h2>
              <div className="h-[430px] w-full">
                <TradingViewWidget 
                  symbol={selectedPair?.tradingViewSymbol || 'BTCUSDT'} 
                />
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="bg-purple-900 text-white p-4 rounded-lg mb-4 shadow-lg">
              {gameState === 'idle' ? (
                <div className="text-center">
                  <h2 className="text-xl mb-4">Ready to Play?</h2>
                  <p className="mb-4">Predict whether the price of {selectedCrypto} will go UP or DOWN in {timeSlot * 60} seconds!</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => makePrediction('up')}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg shadow-md transform  transition-all flex items-center justify-center"
                      disabled={!isWalletConnected}
                    >
                      <ArrowUp className="w-5 h-5 mr-1" />
                      UP
                    </button>
                    <button
                      onClick={() => makePrediction('down')}
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg shadow-md transform  transition-all flex items-center justify-center"
                      disabled={!isWalletConnected}
                    >
                      <ArrowDown className="w-5 h-5 mr-1" />
                      DOWN
                    </button>
                  </div>
                  {!isWalletConnected && (
                    <p className="mt-4 text-yellow-400">Connect your wallet to play!</p>
                  )}
                </div>
              ) : gameState === 'predicting' ? (
                <div className="text-center">
                  <h2 className="text-xl mb-2">Prediction in Progress!</h2>
                  <p className="mb-4">You predicted {selectedCrypto} will go <span className={`font-bold ${prediction === 'up' ? 'text-green-500' : 'text-red-500'}`}>{prediction?.toUpperCase()}</span></p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-gray-400">Starting Price:</p>
                      <p className="text-lg">${formatPriceDisplay(initialPrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Current Price:</p>
                      <p className="text-lg">${formatPriceDisplay(currentPrice)}</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                    <div className="bg-yellow-400 h-2.5 rounded-xl" style={{ width: `${Math.min(100, ((timeSlot * 60 - countdown) / (timeSlot * 60)) * 100)}%` }}></div>
                  </div>
                  
                  <p>Time : <span className="font-medium">{Math.max(0, timeSlot * 60 - countdown)} seconds</span></p>
                </div>
              ) : gameState === 'result' ? (
                <div className="text-center">
                  <h2 className="text-2xl mb-4">
                    {prediction && finalPrice && initialPrice && (
                      (prediction === 'up' && finalPrice > initialPrice) || 
                      (prediction === 'down' && finalPrice < initialPrice) ? (
                        <span className="text-green-500">🎉 You Won! 🎉</span>
                      ) : (
                        <span className="text-red-500">😔 You Lost</span>
                      )
                    )}
                  </h2>
                  
                  <p className="mb-4">
                    You predicted {selectedCrypto} would go <span className={`font-bold ${prediction === 'up' ? 'text-green-500' : 'text-red-500'}`}>{prediction?.toUpperCase()}</span>
                  </p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-gray-400">Starting Price:</p>
                      <p className="text-lg">${formatPriceDisplay(initialPrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Final Price:</p>
                      <p className="text-lg">${formatPriceDisplay(finalPrice)}</p>
                    </div>
                  </div>
                  
                  <div className="my-6">
                    {prediction && finalPrice && initialPrice && (
                      (prediction === 'up' && finalPrice > initialPrice) || 
                      (prediction === 'down' && finalPrice < initialPrice) ? (
                        <p className="text-green-500 text-lg">Great job! Your prediction was correct.</p>
                      ) : (
                        <p className="text-yellow-400 text-lg">Don't worry! The market is unpredictable. Try again!</p>
                      )
                    )}
                  </div>
                  
                  <button
                    onClick={resetGame}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg shadow-md transform hover:scale-105 transition-all mt-4"
                  >
                    Play Again
                  </button>
                </div>
              ) : null}
            </div>
            
            {/* How to Play */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="flex items-center text-lg font-semibold mb-4">
                <Info className="w-5 h-5 mr-2 text-purple-600" />
                How to Play
              </h2>
              <ol className="space-y-3 ml-6 list-decimal text-gray-700">
                <li className="pl-2">Select a cryptocurrency from the list of available options.</li>
                <li className="pl-2">Choose a time slot for your prediction (1, 3, 5, or 10 minutes).</li>
                <li className="pl-2">Predict whether the price will go UP or DOWN within the selected time frame.</li>
                <li className="pl-2">Watch the live price movement during the countdown.</li>
                <li className="pl-2">When the timer ends, see if your prediction was correct!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoPredictionGame; 