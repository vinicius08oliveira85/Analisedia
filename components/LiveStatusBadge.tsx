import React from 'react';
import type { LiveMatchStatus, MatchOdds } from '../types';

interface LiveStatusBadgeProps {
  liveStatus?: LiveMatchStatus;
  odds?: MatchOdds;
}

export const LiveStatusBadge: React.FC<LiveStatusBadgeProps> = ({ liveStatus, odds }) => {
  if (!liveStatus && !odds) return null;

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5">
      {/* Status ao vivo */}
      {liveStatus && (
        <div className="flex items-center gap-1 sm:gap-1.5">
          {liveStatus.isLive && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-500"></span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-red-400">AO VIVO</span>
              {liveStatus.minute && (
                <span className="text-[9px] sm:text-[10px] text-gray-400">{liveStatus.minute}'</span>
              )}
            </div>
          )}
          
          {liveStatus.status === 'halftime' && (
            <span className="text-[9px] sm:text-[10px] font-semibold text-yellow-400">INTERVALO</span>
          )}
          
          {liveStatus.status === 'finished' && (
            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400">FINALIZADO</span>
          )}

          {liveStatus.homeScore !== undefined && liveStatus.awayScore !== undefined && (
            <span className="text-xs sm:text-sm font-bold text-white ml-1 sm:ml-2">
              {liveStatus.homeScore} - {liveStatus.awayScore}
            </span>
          )}
        </div>
      )}

      {/* Odds */}
      {odds && (
        <div className="flex flex-wrap gap-1 sm:gap-1.5 text-[9px] sm:text-[10px]">
          {odds.homeWin && (
            <div className="bg-blue-600/20 border border-blue-500/50 rounded px-1 sm:px-1.5 py-0.5">
              <span className="text-gray-400">C:</span>
              <span className="font-bold text-blue-400 ml-0.5">{odds.homeWin.toFixed(2)}</span>
            </div>
          )}
          {odds.draw && (
            <div className="bg-yellow-600/20 border border-yellow-500/50 rounded px-1 sm:px-1.5 py-0.5">
              <span className="text-gray-400">E:</span>
              <span className="font-bold text-yellow-400 ml-0.5">{odds.draw.toFixed(2)}</span>
            </div>
          )}
          {odds.awayWin && (
            <div className="bg-green-600/20 border border-green-500/50 rounded px-1 sm:px-1.5 py-0.5">
              <span className="text-gray-400">V:</span>
              <span className="font-bold text-green-400 ml-0.5">{odds.awayWin.toFixed(2)}</span>
            </div>
          )}
          {odds.over1_5 && (
            <div className="bg-purple-600/20 border border-purple-500/50 rounded px-1 sm:px-1.5 py-0.5">
              <span className="text-gray-400">O1.5:</span>
              <span className="font-bold text-purple-400 ml-0.5">{odds.over1_5.toFixed(2)}</span>
            </div>
          )}
          {odds.under1_5 && (
            <div className="bg-orange-600/20 border border-orange-500/50 rounded px-1 sm:px-1.5 py-0.5">
              <span className="text-gray-400">U1.5:</span>
              <span className="font-bold text-orange-400 ml-0.5">{odds.under1_5.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

