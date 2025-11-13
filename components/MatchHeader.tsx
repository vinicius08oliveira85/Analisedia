import React from 'react';
import { TeamLogo } from './TeamLogo';
import { FavoriteButton } from './FavoriteButton';
import { LiveStatusBadge } from './LiveStatusBadge';
import type { TeamInfo, MatchInfo, LiveMatchStatus, MatchOdds } from '../types';

interface MatchHeaderProps {
  teamA: TeamInfo;
  teamB: TeamInfo;
  matchInfo: MatchInfo;
  matchId: string;
  isFavorite: boolean;
  onToggleFavorite: (matchId: string) => void;
  liveStatus?: LiveMatchStatus;
  odds?: MatchOdds;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ teamA, teamB, matchInfo, matchId, isFavorite, onToggleFavorite, liveStatus, odds }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 relative">
      <div className="absolute top-4 right-4">
        <FavoriteButton 
          isFavorite={isFavorite} 
          onClick={() => onToggleFavorite(matchId)} 
        />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-around text-center">
        <div className="flex flex-col items-center w-full md:w-1/3 mb-4 md:mb-0">
          <TeamLogo src={teamA.logo} alt={teamA.name} />
          <h2 className="text-2xl font-bold mt-2 text-white">{teamA.name}</h2>
          {liveStatus?.homeScore !== undefined && (
            <div className="text-3xl font-bold text-white mt-2">{liveStatus.homeScore}</div>
          )}
        </div>

        <div className="flex flex-col items-center w-full md:w-1/3 text-gray-300">
          <span className="text-4xl font-light text-gray-400 mb-2">VS</span>
          <p className="font-semibold text-lg">{matchInfo.competition}</p>
          <p className="text-sm">{matchInfo.date} - {matchInfo.time}</p>
          {/* Status ao vivo e odds */}
          <div className="mt-3">
            <LiveStatusBadge liveStatus={liveStatus} odds={odds} />
          </div>
        </div>

        <div className="flex flex-col items-center w-full md:w-1/3 mt-4 md:mt-0">
          <TeamLogo src={teamB.logo} alt={teamB.name} />
          <h2 className="text-2xl font-bold mt-2 text-white">{teamB.name}</h2>
          {liveStatus?.awayScore !== undefined && (
            <div className="text-3xl font-bold text-white mt-2">{liveStatus.awayScore}</div>
          )}
        </div>
      </div>
    </div>
  );
};