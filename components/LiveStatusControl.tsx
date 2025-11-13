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
    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full ${isPolling ? 'bg-red-400 opacity-75 animate-ping' : 'bg-gray-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPolling ? 'bg-red-500' : 'bg-gray-600'}`}></span>
            </span>
            <span className="text-sm font-semibold text-white">
              {isPolling ? 'Atualizando automaticamente' : 'Atualização pausada'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            ({liveMatchesCount} {liveMatchesCount === 1 ? 'jogo ao vivo' : 'jogos ao vivo'})
          </span>
        </div>
        <div className="flex gap-2">
          {isPolling ? (
            <button
              onClick={onStop}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors"
            >
              Pausar
            </button>
          ) : (
            <button
              onClick={onStart}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
            >
              Iniciar Atualização
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

