import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import CryptoTable from './components/CryptoTable';
import FeaturesSection from './components/FeaturesSection';
import SubscriptionSection from './components/SubscriptionSection';
import Footer from './components/Footer';
import F_G_Index from './components/F&G_Index';
import Watchlist from './pages/Watchlist';
import TrendingPage from './pages/TrendingPage';
import UpOrDown from './pages/upordown';

function App() {
  const [watchlist, setWatchlist] = useState([]);

  const addToWatchlist = useCallback((coinId) => {
    if (!watchlist.includes(coinId)) {
      setWatchlist(prev => [...prev, coinId]);
    }
  }, []);

  const removeFromWatchlist = useCallback((coinId) => {
    setWatchlist(prev => prev.filter(id => id !== coinId));
  }, []);

  const HomePage = () => (
    <>
      <HeroSection />
      <div className="container mx-auto px-4">
        <F_G_Index />
      </div>
      <CryptoTable 
        watchlist={watchlist} 
        addToWatchlist={addToWatchlist} 
        removeFromWatchlist={removeFromWatchlist} 
      />
      <SubscriptionSection />
      <FeaturesSection />
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/watchlist" 
          element={
            <Watchlist 
              watchlist={watchlist} 
              removeFromWatchlist={removeFromWatchlist} 
            />
          } 
        />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/upordown" element={<UpOrDown />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;