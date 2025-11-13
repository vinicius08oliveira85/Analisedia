import React, { useState, useRef } from 'react';
import { updateMatchesFromHTML, uploadMatchesFile, type UpdateMatchesResponse } from '../services/matchesService';
import { scrapeMatchesFromSite } from '../services/scrapeService';
import type { MatchDetails } from '../types';

interface UpdateMatchesProps {
  onMatchesUpdated: (matches: MatchDetails[]) => void;
  onLeaguesUpdated?: (leagues: Array<{ leagueName: string; matches: MatchDetails[] }>) => void;
}

export const UpdateMatches: React.FC<UpdateMatchesProps> = ({ onMatchesUpdated, onLeaguesUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const result: UpdateMatchesResponse = await uploadMatchesFile(file);
      setMessage({ type: 'success', text: result.message });
      onMatchesUpdated(result.matches);
      
      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar jogos';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasteHTML = async () => {
    try {
      const html = await navigator.clipboard.readText();
      if (!html || html.trim().length === 0) {
        setMessage({ type: 'error', text: 'Nenhum texto encontrado na área de transferência' });
        return;
      }

      setIsUpdating(true);
      setMessage(null);

      const result: UpdateMatchesResponse = await updateMatchesFromHTML(html);
      setMessage({ type: 'success', text: result.message });
      onMatchesUpdated(result.matches);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar jogos';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleScrapeSite = async () => {
    setIsUpdating(true);
    setMessage(null);

    try {
      const result = await scrapeMatchesFromSite();
      setMessage({ 
        type: 'success', 
        text: `${result.message}. ${result.leagues.length} ligas encontradas.` 
      });
      onMatchesUpdated(result.matches);
      if (onLeaguesUpdated && result.leagues.length > 0) {
        onLeaguesUpdated(result.leagues);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer scraping do site';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Atualizar Jogos do Dia</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleScrapeSite}
            disabled={isUpdating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            title="Faz scraping direto do site academiadasapostasbrasil.com"
          >
            {isUpdating ? 'Processando...' : '🔄 Buscar do Site'}
          </button>
          <button
            onClick={handlePasteHTML}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            {isUpdating ? 'Processando...' : 'Colar HTML'}
          </button>
          <label className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors cursor-pointer">
            {isUpdating ? 'Processando...' : 'Upload de Arquivo'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.html"
              onChange={handleFileUpload}
              disabled={isUpdating}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-900/50 border border-green-700 text-green-200'
              : 'bg-red-900/50 border border-red-700 text-red-200'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <p className="text-gray-400 text-sm mt-3">
        💡 <strong>Dica:</strong> Use "Buscar do Site" para fazer scraping automático, ou cole o HTML manualmente/faça upload do arquivo .txt
      </p>
    </div>
  );
};

