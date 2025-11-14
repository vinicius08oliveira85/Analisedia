import React from 'react';

interface LiveStatusControlProps {
  isPolling: boolean;
  onStart: () => void;
  onStop: () => void;
  liveMatchesCount: number;
}

export const LiveStatusControl: React.FC<LiveStatusControlProps> = ({
  isPolling,
  onStart,
  onStop,
  liveMatchesCount
}) => {
  if (liveMatchesCount === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 mb-2 sm:mb-3 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full ${isPolling ? 'bg-red-400 opacity-75 animate-ping' : 'bg-gray-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${isPolling ? 'bg-red-500' : 'bg-gray-600'}`}></span>
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-white">
              {isPolling ? 'Atualizando' : 'Pausado'}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-gray-400">
            ({liveMatchesCount} ao vivo)
          </span>
        </div>
        <div className="flex gap-1 sm:gap-1.5">
          {isPolling ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStop();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStop();
              }}
              className="px-2 py-1 sm:px-2.5 sm:py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] sm:text-xs font-medium transition-colors touch-manipulation"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '44px',
                minWidth: '44px',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Pausar
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStart();
              }}
              className="px-2 py-1 sm:px-2.5 sm:py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] sm:text-xs font-medium transition-colors touch-manipulation"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '44px',
                minWidth: '44px',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Iniciar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

