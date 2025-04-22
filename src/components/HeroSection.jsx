import React from 'react';
import ksIcon from '../assets/ksicon.svg';

function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 text-white py-16 sm:py-24 md:py-32 relative z-0">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-6 sm:gap-8">
        <div className="flex items-center text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter">
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent font-['Poppins']">
            K
          </span>
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text pr-1 sm:pr-2 text-transparent font-['Poppins'] lowercase">
            rypt
          </span>
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-full h-full rounded-full bg-yellow-400/20 animate-pulse"></div>
            <img 
              src={ksIcon} 
              alt="KryptoScreener Logo"
              className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 object-contain rounded-full drop-shadow-[0_0_30px_rgba(255,215,0,0.4)] relative z-10 cursor-pointer hover:animate-spin-slow transition-transform duration-300"
            />
          </div>
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent font-['Poppins']">
            S
          </span>
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent font-['Poppins'] lowercase">
            creener
          </span>
        </div>
        <p className="text-base sm:text-xl md:text-2xl text-yellow-300 text-center font-light max-w-xs sm:max-w-lg md:max-w-2xl px-2">
          Read the Trends. Play the Game. Rule the Market.
        </p>
      </div>
    </section>
  );
}

export default HeroSection;