import React from 'react';
import { UpdateMatchDetails } from './UpdateMatchDetails';
import { UpdateLiveStatus } from './UpdateLiveStatus';
import { LeaguesTab } from './LeaguesTab';
import type { MatchDetails, LiveMatchStatus, MatchOdds } from '../types';

interface SettingsTabProps {
  match: MatchDetails;
  onDetailsUpdated: (updatedMatch: MatchDetails) => void;
  onStatusUpdated: (matchId: string, liveStatus?: LiveMatchStatus, odds?: MatchOdds) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ match, onDetailsUpdated, onStatusUpdated }) => {
  const handleDetailsUpdated = (updatedMatch: MatchDetails) => {
    onDetailsUpdated(updatedMatch);
  };

  const handleLiveStatusUpdated = (matchId: string, liveStatus?: LiveMatchStatus, odds?: MatchOdds) => {
    onStatusUpdated(matchId, liveStatus, odds);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700">
        <h3 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">⚙️ Configurações e Importação</h3>
        <p className="text-[10px] sm:text-xs text-gray-400 mb-3 sm:mb-4">
          Use as opções abaixo para importar e atualizar dados da partida, ligas e status ao vivo.
        </p>
      </div>

      <UpdateMatchDetails match={match} onDetailsUpdated={handleDetailsUpdated} />
      <UpdateLiveStatus match={match} onStatusUpdated={handleLiveStatusUpdated} />
      <LeaguesTab 
        match={match} 
        onLeagueSelected={(league) => {
          // Dispara evento para o UpdateMatchDetails
          window.dispatchEvent(new CustomEvent('league-selected', { detail: league }));
        }}
      />
    </div>
  );
};

