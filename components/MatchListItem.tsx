import React, { useRef } from 'react';
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
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isTouchDevice = useRef(false);

  const handleFavoriteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite(match.id);
  };

  const handleCardAction = () => {
    console.log('Card acionado, abrindo detalhes do match:', match.id);
    onClick();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isTouchDevice.current = true;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    const target = e.target as HTMLElement;
    const favoriteButton = target.closest('button[aria-label*="favorito"]');
    if (favoriteButton) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Se o movimento foi pequeno (< 15px) e rápido (< 400ms), considera como toque
    if (deltaX < 15 && deltaY < 15 && deltaTime < 400) {
      e.preventDefault();
      e.stopPropagation();
      // Pequeno delay para garantir que o evento foi processado
      setTimeout(() => {
        handleCardAction();
      }, 50);
    }

    touchStartRef.current = null;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // No mobile, ignora onClick se já foi tratado por touch (reset após 300ms)
    if (isTouchDevice.current) {
      setTimeout(() => {
        isTouchDevice.current = false;
      }, 300);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const target = e.target as HTMLElement;
    const favoriteButton = target.closest('button[aria-label*="favorito"]');
    if (favoriteButton) {
      return;
    }

    handleCardAction();
  };

  const isLive = match.liveStatus?.isLive || false;

  return (
    <div 
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`bg-gray-800 rounded-md p-1.5 sm:p-2.5 cursor-pointer hover:bg-gray-700/70 active:bg-gray-700 transition-all duration-200 shadow border mb-1.5 touch-manipulation ${isFavorite ? 'border-yellow-400/50' : isLive ? 'border-red-500/50' : 'border-transparent hover:border-green-500'}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ 
        WebkitTapHighlightColor: 'transparent', 
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none'
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