import React, { useState } from 'react';
import { UpdateMatches } from './UpdateMatches';
import { useAutoScraping } from '../hooks/useAutoScraping';
import type { MatchDetails } from '../types';

interface ConfigTabProps {
  onMatchesUpdated: (matches: MatchDetails[]) => void;
  onLeaguesUpdated?: (leagues: Array<{ leagueName: string; matches: MatchDetails[] }>) => void;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({ onMatchesUpdated, onLeaguesUpdated }) => {
  const [autoScrapingEnabled, setAutoScrapingEnabled] = useState(false);
  const [scrapingInterval, setScrapingInterval] = useState(60000); // 1 minuto padrão

  const { isScraping, lastUpdate, error, startScraping, stopScraping } = useAutoScraping(
    onMatchesUpdated,
    onLeaguesUpdated,
    {
      enabled: autoScrapingEnabled,
      intervalMs: scrapingInterval,
      url: 'https://www.academiadasapostasbrasil.com/'
    }
  );

  const handleToggleAutoScraping = () => {
    if (autoScrapingEnabled) {
      stopScraping();
      setAutoScrapingEnabled(false);
    } else {
      setAutoScrapingEnabled(true);
    }
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff} segundos atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutos atrás`;
    return date.toLocaleTimeString('pt-BR');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700">
        <h2 className="text-sm sm:text-base font-semibold text-white mb-2">⚙️ Configurações e Importação</h2>
        <p className="text-[10px] sm:text-xs text-gray-400 mb-3 sm:mb-4">
          Use as opções abaixo para importar partidas do academiadasapostasbrasil.com
        </p>
      </div>

      {/* Atualização Automática em Tempo Real */}
      <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">🔄 Atualização Automática em Tempo Real</h3>
            <p className="text-[10px] sm:text-xs text-gray-400">
              Atualiza automaticamente as partidas do site academiadasapostasbrasil.com
            </p>
          </div>
          <button
            onClick={handleToggleAutoScraping}
            onTouchEnd={(e) => {
              if (!isScraping) {
                e.preventDefault();
                handleToggleAutoScraping();
              }
            }}
            disabled={isScraping}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-[10px] sm:text-xs font-medium transition-colors touch-manipulation ${
              autoScrapingEnabled
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isScraping ? 'Atualizando...' : autoScrapingEnabled ? '⏸️ Pausar' : '▶️ Iniciar'}
          </button>
        </div>

        {autoScrapingEnabled && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] sm:text-xs text-gray-300">
                Intervalo (segundos):
              </label>
              <select
                value={scrapingInterval / 1000}
                onChange={(e) => setScrapingInterval(Number(e.target.value) * 1000)}
                disabled={isScraping}
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-[10px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="30">30s</option>
                <option value="60">1min</option>
                <option value="120">2min</option>
                <option value="300">5min</option>
                <option value="600">10min</option>
              </select>
            </div>
            
            {lastUpdate && (
              <div className="text-[10px] sm:text-xs text-gray-400">
                Última atualização: <span className="text-green-400">{formatLastUpdate(lastUpdate)}</span>
              </div>
            )}
            
            {error && (
              <div className="text-[10px] sm:text-xs text-red-400 bg-red-900/30 p-2 rounded">
                ⚠️ Erro: {error}
              </div>
            )}

            {isScraping && (
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-blue-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                Atualizando partidas...
              </div>
            )}
          </div>
        )}
      </div>

      <UpdateMatches 
        onMatchesUpdated={onMatchesUpdated} 
        onLeaguesUpdated={onLeaguesUpdated}
      />
    </div>
  );
};

