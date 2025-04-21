import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import useBinanceSocket from '../hooks/useBinanceSocket';
import confetti from 'canvas-confetti';
import CryptoPriceCard from './CryptoPriceCard';

const TIME_OPTIONS = [
  { label: '1 Minute', value: 60 },
  { label: '3 Minutes', value: 180 },
  { label: '5 Minutes', value: 300 }
];

const CRYPTO_OPTIONS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];

const PredictionGame = () => {
  const { connected, publicKey } = useWallet();
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedTimeOption, setSelectedTimeOption] = useState(TIME_OPTIONS[0]);
  const [prediction, setPrediction] = useState(null); // 'up' or 'down'
  const [gameActive, setGameActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [gameResult, setGameResult] = useState(null); // 'win', 'loss', or null
  const [stats, setStats] = useState({ wins: 0, losses: 0, totalPlayed: 0 });
  const timerRef = useRef(null);
  const startPriceRef = useRef(null);
  
  const { price, isConnected } = useBinanceSocket(selectedCrypto);
  
  // Load stats from localStorage on mount
  useEffect(() => {
    if (publicKey) {
      const savedStats = localStorage.getItem(`kryptoPredictStats_${publicKey.toString()}`);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
      
      // Check for ongoing game
      const ongoingGame = localStorage.getItem(`ongoingGame_${publicKey.toString()}`);
      if (ongoingGame) {
        const gameData = JSON.parse(ongoingGame);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = gameData.endTime - currentTime;
        
        if (timeLeft > 0) {
          // Resume ongoing game
          setSelectedCrypto(gameData.crypto);
          setPrediction(gameData.prediction);
          setGameActive(true);
          startPriceRef.current = gameData.startPrice;
          setTimeRemaining(timeLeft);
          startCountdown(timeLeft);
        } else {
          // Game should have ended but wasn't processed
          localStorage.removeItem(`ongoingGame_${publicKey.toString()}`);
        }
      }
    }
  }, [publicKey]);
  
  // Save stats to localStorage when they change
  useEffect(() => {
    if (publicKey && stats.totalPlayed > 0) {
      localStorage.setItem(`kryptoPredictStats_${publicKey.toString()}`, JSON.stringify(stats));
    }
  }, [stats, publicKey]);
  
  // Start countdown timer
  const startCountdown = (seconds) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeRemaining(seconds);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // When timer reaches zero, finish the game
  useEffect(() => {
    if (timeRemaining === 0 && gameActive) {
      finishGame();
    }
  }, [timeRemaining, gameActive]);
  
  // Handle crypto change
  const handleCryptoChange = (crypto) => {
    if (!gameActive) {
      setSelectedCrypto(crypto);
    }
  };
  
  // Handle time option change
  const handleTimeOptionChange = (option) => {
    if (!gameActive) {
      setSelectedTimeOption(option);
    }
  };
  
  // Make a prediction
  const makePrediction = (direction) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!isConnected || !price) {
      alert('Waiting for price data. Please try again.');
      return;
    }
    
    setPrediction(direction);
    setGameActive(true);
    setGameResult(null);
    startPriceRef.current = price;
    
    // Start countdown
    startCountdown(selectedTimeOption.value);
    
    // Save ongoing game to localStorage
    if (publicKey) {
      const endTime = Math.floor(Date.now() / 1000) + selectedTimeOption.value;
      const gameData = {
        crypto: selectedCrypto,
        prediction: direction,
        startPrice: price,
        endTime: endTime
      };
      localStorage.setItem(`ongoingGame_${publicKey.toString()}`, JSON.stringify(gameData));
    }
  };
  
  // Finish the game
  const finishGame = () => {
    if (!gameActive || !startPriceRef.current || !price) return;
    
    // Calculate price difference
    const priceDiff = ((price - startPriceRef.current) / startPriceRef.current) * 100;
    const significantChange = Math.abs(priceDiff) > 0.01; // Small tolerance for "unchanged"
    
    let result;
    if (!significantChange) {
      // Price didn't change significantly
      result = 'draw';
    } else if ((prediction === 'up' && priceDiff > 0) || (prediction === 'down' && priceDiff < 0)) {
      // Prediction was correct
      result = 'win';
      loadConfetti();
    } else {
      // Prediction was wrong
      result = 'loss';
    }
    
    setGameResult(result);
    setGameActive(false);
    
    // Update stats
    setStats(prev => {
      const newStats = {
        wins: prev.wins + (result === 'win' ? 1 : 0),
        losses: prev.losses + (result === 'loss' ? 1 : 0),
        totalPlayed: prev.totalPlayed + 1
      };
      return newStats;
    });
    
    // Remove ongoing game from localStorage
    if (publicKey) {
      localStorage.removeItem(`ongoingGame_${publicKey.toString()}`);
    }
  };
  
  // Reset the game
  const resetGame = () => {
    setPrediction(null);
    setGameResult(null);
    startPriceRef.current = null;
  };
  
  // Format time from seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Load confetti effect
  const loadConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Krypto Predict</h1>
      
      <div className="mb-6">
        <CryptoPriceCard crypto={selectedCrypto} className="mb-4" />
        
        {!gameActive && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Cryptocurrency</label>
              <div className="flex flex-wrap gap-2">
                {CRYPTO_OPTIONS.map(crypto => (
                  <button
                    key={crypto}
                    onClick={() => handleCryptoChange(crypto)}
                    className={`px-4 py-2 rounded-md ${
                      selectedCrypto === crypto
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    aria-label={`Select ${crypto}`}
                    tabIndex="0"
                  >
                    {crypto}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Frame</label>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleTimeOptionChange(option)}
                    className={`px-4 py-2 rounded-md ${
                      selectedTimeOption.value === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    aria-label={`Select ${option.label} time frame`}
                    tabIndex="0"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        
        {!gameActive && !gameResult && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => makePrediction('up')}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center"
              disabled={!connected || !isConnected}
              aria-label="Predict price will go up"
              tabIndex="0"
            >
              <span className="mr-2">↑</span> Price Will Go Up
            </button>
            <button
              onClick={() => makePrediction('down')}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center"
              disabled={!connected || !isConnected}
              aria-label="Predict price will go down"
              tabIndex="0"
            >
              <span className="mr-2">↓</span> Price Will Go Down
            </button>
          </div>
        )}
        
        {gameActive && (
          <div className="mt-6 text-center">
            <div className="mb-2 text-lg font-semibold">
              Your Prediction: 
              <span className={prediction === 'up' ? 'text-green-500 ml-2' : 'text-red-500 ml-2'}>
                Price Will Go {prediction === 'up' ? 'Up ↑' : 'Down ↓'}
              </span>
            </div>
            <div className="text-xl font-bold mb-2">
              Time Remaining: {formatTime(timeRemaining)}
            </div>
            <div className="text-gray-600">
              Starting Price: {startPriceRef.current}
            </div>
            <div className="text-gray-600">
              Current Price: {price}
            </div>
          </div>
        )}
        
        {gameResult && (
          <div className="mt-6 text-center">
            <div className={`text-2xl font-bold mb-4 ${
              gameResult === 'win' ? 'text-green-500' : 
              gameResult === 'loss' ? 'text-red-500' : 'text-gray-600'
            }`}>
              {gameResult === 'win' ? '🎉 You Won! 🎉' : 
               gameResult === 'loss' ? '😢 You Lost' : '🤝 Draw'}
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              aria-label="Play again"
              tabIndex="0"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Your Stats</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-green-500 font-bold text-xl">{stats.wins}</div>
            <div className="text-gray-600">Wins</div>
          </div>
          <div>
            <div className="text-red-500 font-bold text-xl">{stats.losses}</div>
            <div className="text-gray-600">Losses</div>
          </div>
          <div>
            <div className="text-blue-500 font-bold text-xl">
              {stats.totalPlayed > 0 ? Math.round((stats.wins / stats.totalPlayed) * 100) : 0}%
            </div>
            <div className="text-gray-600">Win Rate</div>
          </div>
        </div>
      </div>
      
      {!connected && (
        <div className="mt-6 text-center p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800">Connect your wallet to start making predictions!</p>
        </div>
      )}
    </div>
  );
};

export default PredictionGame; 