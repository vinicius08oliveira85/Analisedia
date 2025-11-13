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

  const isLive = match.liveStatus?.isLive || false;

  return (
    <div onClick={onClick} className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700/70 transition-all duration-200 shadow-lg border ${isFavorite ? 'border-yellow-400/50' : isLive ? 'border-red-500/50' : 'border-transparent hover:border-green-500'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 w-2/5">
          <img src={match.teamA.logo} alt={match.teamA.name} className="w-8 h-8 md:w-10 md:h-10"/>
          <span className="font-semibold text-white truncate text-sm md:text-lg">{match.teamA.name}</span>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg text-white">{match.matchInfo.time}</div>
          <div className="text-xs text-gray-400 truncate">{match.matchInfo.competition}</div>
          {/* Status ao vivo e odds */}
          <div className="mt-2">
            <LiveStatusBadge liveStatus={match.liveStatus} odds={match.odds} />
          </div>
        </div>
        <div className="flex items-center space-x-3 w-2/5 justify-end">
          <span className="font-semibold text-white truncate text-sm md:text-lg text-right">{match.teamB.name}</span>
          <img src={match.teamB.logo} alt={match.teamB.name} className="w-8 h-8 md:w-10 md:h-10"/>
        </div>
        <div className="pl-4">
          <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} />
        </div>
      </div>
    </div>
  );
};