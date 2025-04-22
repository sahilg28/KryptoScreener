import React from 'react';
import CryptoPredictionGame from '../components/CryptoPredictionGame';
import bannerImage from '../assets/PREDICTKRYPTO.png';
import phantomIcon from '../assets/phantom.png'; // Added phantom icon image
import { useSelector } from 'react-redux';
import { selectIsWalletConnected } from '../store/slices/walletSlice';
import PageBanner from '../components/PageBanner';

const UpOrDown = () => {
  const isWalletConnected = useSelector(selectIsWalletConnected);

  const handleConnectWallet = () => {
    window.dispatchEvent(new CustomEvent('requestWalletConnect'));
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <PageBanner 
        title="PredictKrypto - Price Prediction Game"
        description="Predict whether a cryptocurrency's price will go UP or DOWN within the selected timeframe. Test your prediction skills without risking real money!"
      />
      
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
        {!isWalletConnected ? (
          // Show only banner with connect wallet button when wallet is not connected
          <div className="relative w-full ">
            <img 
              src={bannerImage} 
              alt="Predict Krypto Banner"
              className="w-full object-cover object-bottom h-64 md:h-[590px]"
            />
            
            <div className=" absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
              <button
                onClick={handleConnectWallet}
                className="px-4 py-3 md:-mb-96 md:mt-32  bg-purple-600 text-white text-xl font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center"
                tabIndex="0"
                aria-label="Connect wallet to play"
              >
                <img 
                  src={phantomIcon} 
                  alt="Phantom Icon"
                  className="w-6 h-6 mx-1 rounded-sm"
                />
                 Connect Wallet to Play
              </button>
            </div>
          </div>
        ) : (
          <CryptoPredictionGame />
        )}
      </div>
    </div>
  );
};

export default UpOrDown; 