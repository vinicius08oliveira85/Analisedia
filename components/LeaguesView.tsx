import React, { useState } from 'react';
import type { MatchDetails } from '../types';
import { MatchListItem } from './MatchListItem';

interface LeagueGroup {
  leagueName: string;
  matches: MatchDetails[];
}

interface LeaguesViewProps {
  leagues: LeagueGroup[];
  onSelectMatch: (matchId: string) => void;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
}

export const LeaguesView: React.FC<LeaguesViewProps> = ({ 
  leagues, 
  onSelectMatch, 
  favorites, 
  onToggleFavorite 
}) => {
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(leagues.map(l => l.leagueName))
  );

  const toggleLeague = (leagueName: string) => {
    setExpandedLeagues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leagueName)) {
        newSet.delete(leagueName);
      } else {
        newSet.add(leagueName);
      }
      return newSet;
    });
  };

  if (leagues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-sm sm:text-base font-bold text-green-400 mb-2 sm:mb-3 text-center">
        Jogos por Liga ({leagues.length} ligas)
      </h2>
      
      {leagues.map((league) => {
        const isExpanded = expandedLeagues.has(league.leagueName);
        const favoritedMatches = league.matches.filter(m => favorites.includes(m.id));
        const otherMatches = league.matches.filter(m => !favorites.includes(m.id));

        return (
          <div key={league.leagueName} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleLeague(league.leagueName)}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">{league.leagueName}</span>
                <span className="text-[10px] sm:text-xs text-gray-400">
                  ({league.matches.length} {league.matches.length === 1 ? 'jogo' : 'jogos'})
                </span>
              </div>
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                {favoritedMatches.length > 0 && (
                  <div className="mb-2 sm:mb-3">
                    <h4 className="text-[10px] sm:text-xs font-semibold text-yellow-400 mb-1.5">Favoritos</h4>
                    <div className="space-y-1.5">
                      {favoritedMatches.map(match => (
                        <MatchListItem
                          key={match.id}
                          match={match}
                          onClick={() => onSelectMatch(match.id)}
                          isFavorite={true}
                          onToggleFavorite={onToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  {otherMatches.map(match => (
                    <MatchListItem
                      key={match.id}
                      match={match}
                      onClick={() => onSelectMatch(match.id)}
                      isFavorite={favorites.includes(match.id)}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

