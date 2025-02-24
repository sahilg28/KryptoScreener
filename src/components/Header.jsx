import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Star } from 'lucide-react';
import ksIcon from '../assets/ksicon.svg';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <img src={ksIcon} alt="KryptoScreener Logo" className="h-8 w-8 rounded-full" />
          <span className="text-2xl font-bold text-purple-700">KryptoScreener</span>
        </Link>
        <div className="flex items-center gap-6">
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <img src="/menu-icon.svg" alt="Menu" />
          </button>
          <div className={`${isMenuOpen ? 'flex' : 'hidden'} flex-col md:flex-row md:flex gap-4`}>
            <Link 
              to="/trending" 
              className="flex items-center gap-2 text-gray-700 hover:text-purple-700 transition-colors duration-300"
            >
              <Flame className="h-5 w-5" />
              <span className="font-medium">Trending Coins</span>
            </Link>
            <Link 
              to="/watchlist" 
              className="flex items-center gap-2 text-gray-700 hover:text-purple-700 transition-colors duration-300"
            >
              <Star className="h-5 w-5" />
              <span className="font-medium">Watchlist</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;