import React from 'react';
import { TrendingUp, Wallet, Bell, BarChart2 } from 'lucide-react';

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md shadow-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-700">
      <div className="text-purple-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Real-Time Coin Data",
      description: "Get instant updates on cryptocurrency prices with our live tracking system",
      icon: <BarChart2 size={32} />
    },
    {
      title: "Market Trends & Insights",
      description: "Advanced analytics tools to help you make informed trading decisions",
      icon: <TrendingUp size={32} />
    },
    {
      title: "Portfolio Management Tool (Coming Soon)",
      description: "Track and manage your crypto investments all in one place",
      icon: <Wallet size={32} />
    },
    {
      title: "Price Alerts Tool (Coming Soon)",
      description: "Customizable alerts to never miss important price movements",
      icon: <Bell size={32} />
    }
  ];

  return (
    <section className="bg-purple-100 py-16 ">
      <div className="container mx-auto px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Why Choose KryptoScreener</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;