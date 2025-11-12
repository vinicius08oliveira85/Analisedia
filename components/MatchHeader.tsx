import React from 'react';
import { TeamLogo } from './TeamLogo';
import { FavoriteButton } from './FavoriteButton';
import type { TeamInfo, MatchInfo } from '../types';

interface MatchHeaderProps {
  teamA: TeamInfo;
  teamB: TeamInfo;
  matchInfo: MatchInfo;
  matchId: string;
  isFavorite: boolean;
  onToggleFavorite: (matchId: string) => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ teamA, teamB, matchInfo, matchId, isFavorite, onToggleFavorite }) => {
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
        </div>

        <div className="flex flex-col items-center w-full md:w-1/3 text-gray-300">
          <span className="text-4xl font-light text-gray-400 mb-2">VS</span>
          <p className="font-semibold text-lg">{matchInfo.competition}</p>
          <p className="text-sm">{matchInfo.date} - {matchInfo.time}</p>
        </div>

        <div className="flex flex-col items-center w-full md:w-1/3 mt-4 md:mt-0">
          <TeamLogo src={teamB.logo} alt={teamB.name} />
          <h2 className="text-2xl font-bold mt-2 text-white">{teamB.name}</h2>
        </div>
      </div>
    </div>
  );
};