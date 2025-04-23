import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Star, Gamepad2, Menu, X } from 'lucide-react';
import ksIcon from '../assets/ksicon.svg';
import WalletConnect from './WalletConnect';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const walletConnectRef = useRef(null);
  const navigate = useNavigate();
  
  // Add event listener for wallet connect requests
  useEffect(() => {
    const handleWalletConnectRequest = () => {
      // Find connect button inside WalletConnect component
      if (walletConnectRef.current) {
        const connectButton = walletConnectRef.current.querySelector('button[data-action="connect-wallet"]');
        if (connectButton && !connectButton.disabled) {
          connectButton.click();
        }
      }
    };
    
    window.addEventListener('requestWalletConnect', handleWalletConnectRequest);
    
    return () => {
      window.removeEventListener('requestWalletConnect', handleWalletConnectRequest);
    };
  }, []);

  // Close menu when navigation occurs
  useEffect(() => {
    setIsMenuOpen(false);
  }, [navigate]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={ksIcon} alt="KryptoScreener Logo" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
            <span className="text-xl sm:text-2xl font-bold text-purple-700">KryptoScreener</span>
          </Link>
        </div>
        <div className="flex items-center">
          <button 
            className="sm:hidden p-2 text-gray-700 hover:text-purple-700 transition-colors" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <nav className={`
            ${isMenuOpen ? 'flex' : 'hidden'} 
            sm:flex absolute top-full left-0 right-0 sm:relative
            flex-col sm:flex-row items-center gap-4 
            bg-white sm:bg-transparent 
            p-4 sm:p-0 
            border-b border-gray-200 sm:border-0
            shadow-md sm:shadow-none
            z-40 sm:z-auto
            transition-all duration-300
          `}>
            <Link 
              to="/trending" 
              className="flex w-full sm:w-auto items-center gap-2 py-2 sm:py-0 text-gray-700 hover:text-purple-700 transition-colors duration-300"
              tabIndex="0"
              aria-label="Trending Coins"
            >
              <Flame className="h-5 w-5" />
              <span className="font-medium">Trending Coins</span>
            </Link>
            <Link 
              to="/watchlist" 
              className="flex w-full sm:w-auto items-center gap-2 py-2 sm:py-0 text-gray-700 hover:text-purple-700 transition-colors duration-300"
              tabIndex="0"
              aria-label="Watchlist"
            >
              <Star className="h-5 w-5" />
              <span className="font-medium">Watchlist</span>
            </Link>
            <Link 
              to="/predictkrypto" 
              className="flex w-full sm:w-auto items-center gap-2 py-2 sm:py-0 text-gray-700 hover:text-purple-700 transition-colors duration-300"
              tabIndex="0"
              aria-label="PredictKrypto"
            >
              <Gamepad2 className="h-5 w-5" />
              <span className="font-medium">PredictKrypto</span>
            </Link>
            <div className="w-full sm:w-auto py-2 sm:py-0 sm:ml-2" ref={walletConnectRef}>
              <WalletConnect />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;