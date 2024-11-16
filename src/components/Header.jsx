import React from 'react';
import { Flame, Star } from 'lucide-react';
import ksIcon from '../assets/ksicon.svg';

function Header({ setCurrentPage }) {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left side - Logo and Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
          <img 
            src={ksIcon} 
            alt="KryptoScreener Logo" 
            className="h-8 w-8 rounded-full"
          />
          <span className="text-2xl font-bold text-purple-700">
            KryptoScreener
          </span>
        </div>

        {/* Right side - Navigation Buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentPage('trending')}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-700 transition-colors duration-300"
          >
            <Flame className="h-5 w-5" />
            <span className="font-medium">Trending Coins</span>
          </button>

          <button
            onClick={() => setCurrentPage('watchlist')}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-700 transition-colors duration-300"
          >
            <Star className="h-5 w-5" />
            <span className="font-medium">Watchlist</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;