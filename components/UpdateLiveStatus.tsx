import React, { useState } from 'react';
import { updateLiveStatus } from '../services/liveStatusService';
import type { MatchDetails, LiveMatchStatus, MatchOdds } from '../types';

interface UpdateLiveStatusProps {
  match: MatchDetails;
  onStatusUpdated: (matchId: string, liveStatus?: LiveMatchStatus, odds?: MatchOdds) => void;
}

export const UpdateLiveStatus: React.FC<UpdateLiveStatusProps> = ({ match, onStatusUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasteHTML = async () => {
    try {
      const html = await navigator.clipboard.readText();
      if (!html || html.trim().length === 0) {
        setMessage({ type: 'error', text: 'Nenhum texto encontrado na área de transferência' });
        return;
      }

      setIsUpdating(true);
      setMessage(null);

      const result = await updateLiveStatus(html, match.id);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onStatusUpdated(match.id, result.liveStatus, result.odds);
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar status' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status ao vivo';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-gray-700">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <h3 className="text-[10px] sm:text-xs font-semibold text-white">Status ao Vivo</h3>
        <button
          onClick={handlePasteHTML}
          disabled={isUpdating}
          className="px-2 py-1 sm:px-2.5 sm:py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-[9px] sm:text-[10px] font-medium transition-colors"
        >
          {isUpdating ? '...' : '📋 Colar HTML'}
        </button>
      </div>

      {message && (
        <div
          className={`p-1.5 sm:p-2 rounded-md text-[9px] sm:text-[10px] ${
            message.type === 'success'
              ? 'bg-green-900/50 border border-green-700 text-green-200'
              : 'bg-red-900/50 border border-red-700 text-red-200'
          }`}
        >
          <p>{message.text}</p>
        </div>
      )}

      <p className="text-gray-400 text-[9px] sm:text-[10px] mt-1.5">
        💡 Cole o HTML da página do jogo para atualizar status e odds
      </p>
    </div>
  );
};

