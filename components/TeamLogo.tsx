
import React from 'react';

interface TeamLogoProps {
  src: string;
  alt: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ src, alt }) => {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-700 rounded-full flex items-center justify-center p-1 sm:p-1.5 shadow-inner">
      <img src={src} alt={alt} className="w-full h-full object-contain" />
    </div>
  );
};
