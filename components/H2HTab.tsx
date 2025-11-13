import React from 'react';
import { MatchCard } from './MatchCard';
import type { Match } from '../types';

interface H2HTabProps {
    h2hData: Match[];
}

export const H2HTab: React.FC<H2HTabProps> = ({ h2hData }) => {
  return (
    <div>
      <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-green-400">Confronto Direto</h3>
      <div className="max-w-2xl mx-auto">
        {h2hData.length > 0 ? (
            h2hData.map((match, index) => (
                <MatchCard key={index} match={match} />
            ))
        ) : (
            <p className="text-gray-400 text-center text-[10px] sm:text-xs">Não há dados de confronto direto recentes.</p>
        )}
      </div>
    </div>
  );
};
