import React from 'react';
import { formatPrice, formatPercent } from '../services/binanceSocket';
import useBinanceSocket from '../hooks/useBinanceSocket';

const CryptoPriceCard = ({ crypto, className = "" }) => {
  const { price, isPriceUp, isPriceDown, isConnected } = useBinanceSocket(crypto);

  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={`/crypto-icons/${crypto.toLowerCase()}.svg`} 
              alt={`${crypto} icon`} 
              className="w-10 h-10"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/40x40?text=" + crypto;
              }}
            />
            <div>
              <h3 className="font-medium text-gray-900">{crypto}</h3>
              <p className="text-sm text-gray-500">USDT</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className={`text-xl font-semibold transition-colors ${
              isPriceUp ? 'text-green-500' : 
              isPriceDown ? 'text-red-500' : 
              'text-gray-900'
            }`}>
              {isConnected ? formatPrice(price) : '...'}
            </div>
            
            <div className={`flex items-center gap-1 text-sm ${
              isPriceUp ? 'text-green-500' : 
              isPriceDown ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {isConnected ? (
                <>
                  <span>{isPriceUp ? '↑' : isPriceDown ? '↓' : '•'}</span>
                  <span>24h</span>
                </>
              ) : (
                <span>Connecting...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoPriceCard; 