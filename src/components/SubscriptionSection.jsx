import React, { useState } from 'react';
import { Newspaper, Send } from 'lucide-react';

function SubscriptionSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-12 bg-gradient-to-r from-purple-700 to-purple-500 text-white">
      <div className="container mx-auto px-4 text-center">
        <Newspaper className="mx-auto mb-6" size={48} />
        <h2 className="text-3xl font-bold mb-4">Join Our Crypto Community</h2>
        <p className="text-xl mb-8">
          Get weekly insights, market updates, and exclusive trading strategies straight to your inbox.
        </p>
        
        <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-grow px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
            <button 
              type="submit"
              className="btn-primary bg-white text-purple-700 hover:bg-purple-100 px-8 py-3 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
            >
              Subscribe
              <Send size={20} className="group-hover:translate-x-1" />
            </button>
          </div>
          {subscribed && (
            <p className="mt-4 text-green-300">Welcome to our community! Check your inbox for updates! 🚀</p>
          )}
        </form>
      </div>
    </section>
  );
}

export default SubscriptionSection;