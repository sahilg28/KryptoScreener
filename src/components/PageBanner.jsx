import React from 'react';

const PageBanner = ({ title, description }) => {
  return (
    <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-center text-purple-100 text-sm sm:text-base max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
};

export default PageBanner; 