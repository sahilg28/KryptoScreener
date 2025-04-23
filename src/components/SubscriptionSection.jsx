import React from 'react';
import bannerImage from '../assets/PREDICTKRYPTO.png';
import { Link } from 'react-router-dom';

function SubscriptionSection() {
  return (
    <section className="bg-gradient-to-r from-purple-700 to-purple-500">
      <div className="w-full">
        <Link to="/predictkrypto" className="block w-full">
          <img 
            src={bannerImage} 
            alt="Predict Krypto Banner"
            className="w-full object-cover object-bottom h-64 md:h-[590px]"
          />
        </Link>
      </div>
    </section>
  );
}

export default SubscriptionSection;
