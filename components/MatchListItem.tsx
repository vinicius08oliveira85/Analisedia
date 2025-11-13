import React from 'react';
import type { MatchDetails } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { LiveStatusBadge } from './LiveStatusBadge';

interface MatchListItemProps {
  match: MatchDetails;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (matchId: string) => void;
}

export const MatchListItem: React.FC<MatchListItemProps> = ({ match, onClick, isFavorite, onToggleFavorite }) => {
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão de favorito acione o onClick do card principal
    onToggleFavorite(match.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Evita que clique em elementos filhos acione o onClick do card
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick();
  };

  const isLive = match.liveStatus?.isLive || false;

  return (
    <div 
      onClick={handleCardClick} 
      className={`bg-gray-800 rounded-md p-1.5 sm:p-2.5 cursor-pointer hover:bg-gray-700/70 transition-all duration-200 shadow border mb-1.5 ${isFavorite ? 'border-yellow-400/50' : isLive ? 'border-red-500/50' : 'border-transparent hover:border-green-500'}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
          <img src={match.teamA.logo} alt={match.teamA.name} className="w-5 h-5 sm:w-7 sm:h-7 flex-shrink-0"/>
          <span className="font-semibold text-white truncate text-[11px] sm:text-xs">{match.teamA.name}</span>
        </div>
        <div className="text-center flex-shrink-0 px-1 sm:px-2">
          <div className="font-bold text-xs sm:text-sm text-white">{match.matchInfo.time}</div>
          <div className="text-[9px] sm:text-[10px] text-gray-400 truncate max-w-[70px] sm:max-w-none">{match.matchInfo.competition}</div>
          {/* Status ao vivo e odds */}
          <div className="mt-0.5 pointer-events-none">
            <LiveStatusBadge liveStatus={match.liveStatus} odds={match.odds} />
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 justify-end">
          <span className="font-semibold text-white truncate text-[11px] sm:text-xs text-right">{match.teamB.name}</span>
          <img src={match.teamB.logo} alt={match.teamB.name} className="w-5 h-5 sm:w-7 sm:h-7 flex-shrink-0"/>
        </div>
        <div className="pl-0.5 sm:pl-1.5 flex-shrink-0">
          <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} />
        </div>
      </div>
    </div>
  );
};