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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">
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
              className="w-full px-6 py-4 bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">{league.leagueName}</span>
                <span className="text-sm text-gray-400">
                  ({league.matches.length} {league.matches.length === 1 ? 'jogo' : 'jogos'})
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="p-4 space-y-4">
                {favoritedMatches.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">Favoritos</h4>
                    <div className="space-y-2">
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
                
                <div className="space-y-2">
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

