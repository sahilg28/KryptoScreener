import React, { useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import CryptoTable from './components/CryptoTable';
import FeaturesSection from './components/FeaturesSection';
import SubscriptionSection from './components/SubscriptionSection';
import Footer from './components/Footer';
import Watchlist from './components/Watchlist';
import TrendingPage from './components/TrendingPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [watchlist, setWatchlist] = useState([]);

  const addToWatchlist = (coinId) => {
    if (!watchlist.includes(coinId)) {
      setWatchlist([...watchlist, coinId]);
    }
  };

  const removeFromWatchlist = (coinId) => {
    setWatchlist(watchlist.filter(id => id !== coinId));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header setCurrentPage={setCurrentPage} />
      {currentPage === 'home' && (
        <>
          <HeroSection />
          <CryptoTable 
            watchlist={watchlist} 
            addToWatchlist={addToWatchlist} 
            removeFromWatchlist={removeFromWatchlist} 
          />
          <FeaturesSection />
          <SubscriptionSection />
        </>
      )}
      {currentPage === 'watchlist' && (
        <Watchlist 
          watchlist={watchlist} 
          removeFromWatchlist={removeFromWatchlist} 
        />
      )}
      {currentPage === 'trending' && <TrendingPage />}
      <Footer />
    </div>
  );
}

export default App;