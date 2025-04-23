import React from 'react';
import { BarChart2, Clock, Gamepad2, Shield, } from 'lucide-react';

function FeaturesSection() {
  const features = [
    {
      icon: <BarChart2 size={32} className="text-purple-600" />,
      title: "Live Market Data",
      description: "Get real-time updates on prices, trends, and insights — stay ahead with every market move."
    },
    {
      icon: <Gamepad2 size={32} className="text-purple-600" />,
      title: "PredictKrypto Game",
      description: "Predict if your coin will go UP or DOWN in minutes. Connect your Phantom wallet, trust your instincts, and show your skills!"
    },
    {
      icon: <Clock size={32} className="text-purple-600" />,
      title: "Watchlist Your Coins",
      description: "Track your favorite cryptocurrencies in one place — always know what matters to you."
    },
    {
      icon: <Shield size={32} className="text-purple-600" />,
      title: "Web3 Wallet Integration",
      description: "Connect your Phantom wallet securely to explore assets, play games, and unlock the full Web3 experience on Solana."
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-4 sm:mb-6 md:mb-12">
          <span className="border-b-2 border-purple-600 pb-2">KryptoScreener Features</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-6 mt-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-4 sm:p-6 rounded-lg shadow-md shadow-purple-300 hover:shadow-lg hover:shadow-purple-400 transition-shadow flex flex-col items-center text-center"
            >
              <div className="mb-4 bg-purple-100 p-3 rounded-full">
                {feature.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;