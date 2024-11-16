import React from 'react';
import { TypeAnimation } from 'react-type-animation';
import ksIcon from '../assets/ksicon.svg';

function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-purple-800 to-purple-700 text-white py-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <TypeAnimation
            sequence={[
              'Track Cryptocurrency Prices in Real-Time',
              2000,
              'Stay Updated with Live Market Trends',
              2000,
              'Monitor Your Favorite Crypto Assets',
              2000,
              'Make Informed Investment Decisions',
              2000,
            ]}
            wrapper="h1"
            speed={50}
            className="text-4xl md:text-5xl font-bold mb-4"
            repeat={Infinity}
          />
          
          <p className="text-xl mb-8">
            Stay updated with live prices, market trends, and personalized alerts on your favorite crypto coins.
          </p>
        </div>
        
        <div className="md:w-1/2 flex justify-center">
          <div className="w-80 h-80 relative group">
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-full bg-yellow-400/50 blur-xl animate-pulse"></div>
            
            {/* Main image */}
            <img 
              src={ksIcon} 
              alt="KS Icon"
              className="absolute inset-0 w-full h-full object-contain rounded-full z-10 
                drop-shadow-[0_0_30px_rgba(255,215,0,0.6)] 
                animate-float"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;