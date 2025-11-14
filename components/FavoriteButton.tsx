import React from 'react';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ isFavorite, onClick }) => {
  return (
    <button
      onClick={onClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className="p-1 sm:p-1.5 rounded-full hover:bg-gray-700/50 active:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-200 touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent', minWidth: '44px', minHeight: '44px' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-300 ease-in-out"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke={isFavorite ? '#FBBF24' : '#9CA3AF'}
        fill={isFavorite ? '#FBBF24' : 'none'}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.321h5.365a.562.562 0 01.321.988l-4.344 3.155a.563.563 0 00-.182.635l1.644 5.051a.563.563 0 01-.81.635L12 18.06l-4.763 3.444a.562.562 0 01-.81-.635l1.644-5.05a.563.563 0 00-.182-.635L3.437 9.92a.562.562 0 01.321-.988h5.365a.563.563 0 00.475-.321l2.125-5.11z"
        />
      </svg>
    </button>
  );
};