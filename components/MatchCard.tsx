
import React from 'react';
import { Match } from '../types';

interface MatchCardProps {
  match: Match;
  perspectiveTeam?: string;
}

const ResultBadge: React.FC<{ result?: 'V' | 'E' | 'D' | 'P' }> = ({ result }) => {
    if (!result) return null;

    const baseClass = 'w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center text-white';
    let bgColor = 'bg-gray-500';
    let text = result;

    if (result === 'V') bgColor = 'bg-green-600';
    if (result === 'E') bgColor = 'bg-yellow-600';
    if (result === 'D') bgColor = 'bg-red-600';
    if (result === 'P') {
        bgColor = 'bg-blue-600';
        text = 'P';
    }


    return <div className={baseClass + ' ' + bgColor}>{text}</div>;
};


export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  return (
    <div className="bg-gray-700 rounded-lg p-1.5 sm:p-2 my-1 sm:my-1.5 shadow-md hover:bg-gray-600 transition-colors duration-200">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex flex-col text-[9px] sm:text-[10px] text-gray-400 text-left">
          <span>{match.date}</span>
          <span className="truncate max-w-[80px] sm:max-w-[100px]">{match.competition}</span>
        </div>
        <div className="flex-grow text-center text-[10px] sm:text-xs md:text-sm font-semibold text-white mx-1 sm:mx-2">
            <div className="flex justify-center items-center gap-0.5 sm:gap-1">
                <span className="text-right flex-1 truncate">{match.homeTeam}</span>
                <span className="bg-gray-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] mx-1">{match.homeScore} - {match.awayScore}</span>
                <span className="text-left flex-1 truncate">{match.awayTeam}</span>
            </div>
        </div>
        <div className="w-5 sm:w-6">
            <ResultBadge result={match.resultForTeam} />
        </div>
      </div>
    </div>
  );
};
