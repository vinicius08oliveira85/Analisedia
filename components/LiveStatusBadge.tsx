import React from 'react';
import type { LiveMatchStatus, MatchOdds } from '../types';

interface LiveStatusBadgeProps {
  liveStatus?: LiveMatchStatus;
  odds?: MatchOdds;
}

export const LiveStatusBadge: React.FC<LiveStatusBadgeProps> = ({ liveStatus, odds }) => {
  if (!liveStatus && !odds) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Status ao vivo */}
      {liveStatus && (
        <div className="flex items-center gap-2">
          {liveStatus.isLive && (
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold text-red-400">AO VIVO</span>
              {liveStatus.minute && (
                <span className="text-xs text-gray-400">{liveStatus.minute}'</span>
              )}
            </div>
          )}
          
          {liveStatus.status === 'halftime' && (
            <span className="text-xs font-semibold text-yellow-400">INTERVALO</span>
          )}
          
          {liveStatus.status === 'finished' && (
            <span className="text-xs font-semibold text-gray-400">FINALIZADO</span>
          )}

          {liveStatus.homeScore !== undefined && liveStatus.awayScore !== undefined && (
            <span className="text-sm font-bold text-white ml-2">
              {liveStatus.homeScore} - {liveStatus.awayScore}
            </span>
          )}
        </div>
      )}

      {/* Odds */}
      {odds && (
        <div className="flex flex-wrap gap-2 text-xs">
          {odds.homeWin && (
            <div className="bg-blue-600/20 border border-blue-500/50 rounded px-2 py-1">
              <span className="text-gray-400">Casa:</span>
              <span className="font-bold text-blue-400 ml-1">{odds.homeWin.toFixed(2)}</span>
            </div>
          )}
          {odds.draw && (
            <div className="bg-yellow-600/20 border border-yellow-500/50 rounded px-2 py-1">
              <span className="text-gray-400">Empate:</span>
              <span className="font-bold text-yellow-400 ml-1">{odds.draw.toFixed(2)}</span>
            </div>
          )}
          {odds.awayWin && (
            <div className="bg-green-600/20 border border-green-500/50 rounded px-2 py-1">
              <span className="text-gray-400">Visitante:</span>
              <span className="font-bold text-green-400 ml-1">{odds.awayWin.toFixed(2)}</span>
            </div>
          )}
          {odds.over1_5 && (
            <div className="bg-purple-600/20 border border-purple-500/50 rounded px-2 py-1">
              <span className="text-gray-400">Over 1.5:</span>
              <span className="font-bold text-purple-400 ml-1">{odds.over1_5.toFixed(2)}</span>
            </div>
          )}
          {odds.under1_5 && (
            <div className="bg-orange-600/20 border border-orange-500/50 rounded px-2 py-1">
              <span className="text-gray-400">Under 1.5:</span>
              <span className="font-bold text-orange-400 ml-1">{odds.under1_5.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

