import React from 'react';
import { MatchCard } from './MatchCard';
import type { Match } from '../types';

interface H2HTabProps {
    h2hData: Match[];
}

export const H2HTab: React.FC<H2HTabProps> = ({ h2hData }) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-green-400">Confronto Direto (Últimos Jogos)</h3>
      <div className="max-w-2xl mx-auto">
        {h2hData.length > 0 ? (
            h2hData.map((match, index) => (
                <MatchCard key={index} match={match} />
            ))
        ) : (
            <p className="text-gray-400 text-center">Não há dados de confronto direto recentes.</p>
        )}
      </div>
    </div>
  );
};
