import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * PriceDisplay component shows price data for a cryptocurrency
 * with visual indicators for price movement
 */
const PriceDisplay = ({ symbol, price, isUp, isDown }) => {
  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-2">
            <span className="font-bold text-gray-800">{symbol}</span>
          </div>
          <span className="text-lg font-medium">{symbol}/USDT</span>
        </div>
      </div>
      
      <div className="flex items-center">
        <span className={`text-3xl font-bold ${
          isUp ? 'text-green-600' : 
          isDown ? 'text-red-600' : 
          'text-gray-800'
        }`}>
          {price || '$0.00'}
        </span>
        
        {isUp && (
          <TrendingUp className="ml-2 text-green-600" size={24} />
        )}
        
        {isDown && (
          <TrendingDown className="ml-2 text-red-600" size={24} />
        )}
      </div>
    </div>
  );
};

export default PriceDisplay; 