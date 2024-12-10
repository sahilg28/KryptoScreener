import React from 'react';
import { Heart, Github, Linkedin, Twitter } from 'lucide-react';
import sahilImage from '../assets/sahil.jpg';
import abhishekImage from '../assets/abhishek_v.jpeg';
import kritabImage from '../assets/kritab2.jpeg';

function Footer() {
  const teamMembers = [
    {
      name: "Abhishek Vishwakarma",
      role: "Frontend Developer",
      image: abhishekImage,
      github: "https://github.com/Abhi005shek",
      linkedin: "https://www.linkedin.com/in/abhishek-vishwakarma-922493315/"
    },
    {
      name: "Sahil Gupta",
      role: "Project Lead & Developer",
      image: sahilImage,
      github: "https://github.com/sahilg28",
      linkedin: "https://www.linkedin.com/in/sahil-gupta-b7983a204/",
      twitter: "https://x.com/sahilgupta_as"
    },
    {
      name: "Kritab",
      role: "Documentation & Developer",
      image: kritabImage,
      github: "https://github.com/Kritab2312/Kritab",
      linkedin: "https://www.linkedin.com/in/kritab-sharma-28759b326/"
    }
  ];

  return (
    <footer className="bg-gradient-to-b from-purple-900 to-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-center mb-8">Team Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-32 h-32 mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-pulse"></div>
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover border-4 border-yellow-500"
                  />
                </div>
                <h4 className="text-lg font-semibold">{member.name}</h4>
                <p className="text-purple-300 mb-3">{member.role}</p>
                <div className="flex space-x-4">
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                    <Github size={20} />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                    <Linkedin size={20} />
                  </a>
                  {member.twitter && (
                    <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                      <Twitter size={20} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center">
          <p className="flex items-center justify-center text-lg">
            KryptoScreener Made with <Heart className="mx-2 text-red-500 fill-current" size={20} /> 
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;