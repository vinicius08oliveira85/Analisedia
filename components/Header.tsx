import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50" style={{ pointerEvents: 'auto' }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-10 sm:h-12">
          <div className="flex items-center">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <h1 className="text-sm sm:text-base font-bold text-white ml-1.5 sm:ml-2">Futibou Analytics</h1>
          </div>
        </div>
      </div>
    </header>
  );
};
