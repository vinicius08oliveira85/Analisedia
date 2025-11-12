import React, { useState, useRef } from 'react';
import { updateMatchDetailsFromHTML, uploadMatchDetailsFile, applyMatchDetailsUpdate, type MatchDetailsResponse } from '../services/matchDetailsService';
import type { MatchDetails } from '../types';

interface UpdateMatchDetailsProps {
  match: MatchDetails;
  onDetailsUpdated: (updatedMatch: MatchDetails) => void;
}

export const UpdateMatchDetails: React.FC<UpdateMatchDetailsProps> = ({ match, onDetailsUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const result: MatchDetailsResponse = await uploadMatchDetailsFile(file, match.id);
      console.log('Resposta da API:', result);
      const updatedMatch = applyMatchDetailsUpdate(match, result.data);
      console.log('Match atualizado:', updatedMatch);
      setMessage({ type: 'success', text: result.message });
      onDetailsUpdated(updatedMatch);
      
      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar detalhes da partida';
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

      const result: MatchDetailsResponse = await updateMatchDetailsFromHTML(html, match.id);
      console.log('Resposta da API:', result);
      const updatedMatch = applyMatchDetailsUpdate(match, result.data);
      console.log('Match atualizado:', updatedMatch);
      setMessage({ type: 'success', text: result.message });
      onDetailsUpdated(updatedMatch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar detalhes da partida';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Atualizar Detalhes da Partida</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePasteHTML}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            {isUpdating ? 'Processando...' : 'Colar HTML da Área de Transferência'}
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
        💡 <strong>Dica:</strong> Cole o HTML da página de detalhes da partida ou faça upload do arquivo .txt
      </p>
    </div>
  );
};

