import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Flame, Star, Gamepad2, Info, Mail, Github, ExternalLink } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  const mainLinks = [
    { name: 'Home', path: '/', icon: <Home size={16} /> },
    { name: 'Trending Coins', path: '/trending', icon: <Flame size={16} /> },
    { name: 'Watchlist', path: '/watchlist', icon: <Star size={16} /> },
    { name: 'PredictKrypto', path: '/upordown', icon: <Gamepad2 size={16} /> }
  ];
  
  const resourceLinks = [
    { name: 'CoinGecko', url: 'https://www.coingecko.com/', icon: <ExternalLink size={14} /> },
    { name: 'CoinMarketCap', url: 'https://coinmarketcap.com/', icon: <ExternalLink size={14} /> },
    { name: 'CryptoFear&Greed', url: 'https://alternative.me/crypto/fear-and-greed-index/', icon: <ExternalLink size={14} /> }
  ];

  const developerTools = [
    { name: 'KryptoScreener Repo', url: 'https://github.com/sahilg28/KryptoScreener', icon: <ExternalLink size={14} /> },
    { name: 'Solana', url: 'https://solana.com/', icon: <ExternalLink size={14} /> },
    { name: 'Phantom Wallet', url: 'https://phantom.app/', icon: <ExternalLink size={14} /> }
  ];

  return (
    <footer className="bg-gradient-to-b from-purple-900 to-purple-950 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-4">
            <div className="flex items-center mb-4">
              <div className="text-3xl font-bold text-white">
                <span className="text-yellow-400">Krypto</span>
                <span className="text-purple-300">Screener</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Your all-in-one platform for tracking cryptocurrency prices, market trends, and making predictions.
              Get real-time data, personalized watchlists, and market sentiment analysis.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold mb-4 border-b border-purple-700 pb-2">Quick Links</h3>
            <ul className="space-y-2">
              {mainLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path} 
                    className="text-gray-300 hover:text-white flex items-center text-sm"
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold mb-4 border-b border-purple-700 pb-2">Resources</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white flex items-center text-sm"
                  >
                    {link.name}
                    <span className="ml-1 opacity-70">{link.icon}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Developer Tools */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 border-b border-purple-700 pb-2">Developer Tools</h3>
            <ul className="space-y-2">
              {developerTools.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white flex items-center text-sm"
                  >
                    {link.name}
                    <span className="ml-1 opacity-70">{link.icon}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-purple-800 text-center">
          <p className="text-sm text-gray-300">
            &copy; {currentYear} KryptoScreener. All rights reserved.
          </p>
          <p className="text-xs text-gray-300 mt-2">
            Cryptocurrency prices and data are provided for informational purposes only.
            KryptoScreener is not a financial advisor.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;