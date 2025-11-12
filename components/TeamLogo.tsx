
import React from 'react';

interface TeamLogoProps {
  src: string;
  alt: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ src, alt }) => {
  return (
    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-700 rounded-full flex items-center justify-center p-2 shadow-inner">
      <img src={src} alt={alt} className="w-full h-full object-contain" />
    </div>
  );
};
