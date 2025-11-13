import React from 'react';
import { MatchDetails } from '../types';
import { MatchListItem } from './MatchListItem';

interface MatchListProps {
  matches: MatchDetails[];
  onSelectMatch: (matchId: string) => void;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, onSelectMatch, favorites, onToggleFavorite }) => {
  const favoritedMatches = matches.filter(match => favorites.includes(match.id));
  const otherMatches = matches.filter(match => !favorites.includes(match.id));

  const renderMatchList = (list: MatchDetails[]) => list.map(match => (
    <MatchListItem 
      key={match.id} 
      match={match} 
      onClick={() => {
        console.log('Clicou no jogo:', match.id);
        onSelectMatch(match.id);
      }}
      isFavorite={favorites.includes(match.id)}
      onToggleFavorite={onToggleFavorite}
    />
  ));

  if (matches.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">Jogos do Dia</h2>
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
          <p className="text-gray-400 text-lg mb-4">Nenhum jogo encontrado para hoje.</p>
          <p className="text-gray-500 text-sm">Atualize os jogos usando o botão acima para ver os jogos do dia.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">Jogos do Dia</h2>
      
      {favoritedMatches.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-yellow-400 mb-3 border-b-2 border-yellow-400/30 pb-2">Favoritos</h3>
          <div className="space-y-4">
            {renderMatchList(favoritedMatches)}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {renderMatchList(otherMatches)}
      </div>
    </div>
  );
};