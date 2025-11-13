import React, { useState, useRef, useEffect } from 'react';
import { updateMatchDetailsFromHTML, uploadMatchDetailsFile, applyMatchDetailsUpdate, scrapeMatchDetailsFromURL, type MatchDetailsResponse } from '../services/matchDetailsService';
import { findLeagueForCompetition } from '../services/leagueService';
import type { MatchDetails } from '../types';

interface UpdateMatchDetailsProps {
  match: MatchDetails;
  onDetailsUpdated: (updatedMatch: MatchDetails) => void;
}

export const UpdateMatchDetails: React.FC<UpdateMatchDetailsProps> = ({ match, onDetailsUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [url, setUrl] = useState(match.matchInfo.url || '');
  const [competitionUrl, setCompetitionUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Busca liga cadastrada para a competição da partida
  useEffect(() => {
    if (match.matchInfo.competition) {
      const league = findLeagueForCompetition(match.matchInfo.competition);
      if (league && league.competitionUrl) {
        setCompetitionUrl(league.competitionUrl);
      }
    }
  }, [match.matchInfo.competition]);

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
      
      // Verifica se há dados extraídos
      if (result.data) {
        const hasData = 
          result.data.teamAForm.length > 0 || 
          result.data.teamBForm.length > 0 || 
          result.data.h2hData.length > 0 ||
          result.data.teamAOpponentAnalysis.home.length > 0 ||
          result.data.teamAOpponentAnalysis.away.length > 0 ||
          result.data.teamAOpponentAnalysis.global.length > 0;
        
        if (!hasData) {
          setMessage({ 
            type: 'error', 
            text: 'Nenhum dado foi extraído do HTML. Verifique se o HTML está completo e se contém as tabelas de estatísticas.' 
          });
          return;
        }
      }
      
      const updatedMatch = applyMatchDetailsUpdate(match, result.data);
      console.log('Match atualizado:', updatedMatch);
      setMessage({ 
        type: 'success', 
        text: `${result.message}. Form: ${result.data.teamAForm.length + result.data.teamBForm.length} jogos, H2H: ${result.data.h2hData.length} jogos` 
      });
      onDetailsUpdated(updatedMatch);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar detalhes da partida';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasteURL = async () => {
    try {
      const urlToUse = url.trim() || await navigator.clipboard.readText();
      
      if (!urlToUse || urlToUse.trim().length === 0) {
        setMessage({ type: 'error', text: 'Nenhuma URL encontrada. Cole a URL no campo ou na área de transferência.' });
        return;
      }

      // Valida se é uma URL válida
      try {
        new URL(urlToUse);
      } catch {
        setMessage({ type: 'error', text: 'URL inválida. Por favor, cole uma URL válida.' });
        return;
      }

      setIsUpdating(true);
      setMessage(null);

      const result: MatchDetailsResponse = await scrapeMatchDetailsFromURL(
        urlToUse, 
        match.id,
        competitionUrl.trim() || undefined
      );
      console.log('Resposta da API (URL):', result);
      
      // Verifica se há dados extraídos
      if (result.data) {
        const hasData = 
          result.data.teamAForm.length > 0 || 
          result.data.teamBForm.length > 0 || 
          result.data.h2hData.length > 0 ||
          result.data.teamAOpponentAnalysis.home.length > 0 ||
          result.data.teamAOpponentAnalysis.away.length > 0 ||
          result.data.teamAOpponentAnalysis.global.length > 0;
        
        if (!hasData) {
          setMessage({ 
            type: 'error', 
            text: 'Nenhum dado foi extraído da URL. Verifique se a URL está correta e se a página contém as tabelas de estatísticas.' 
          });
          return;
        }
      }
      
      const updatedMatch = applyMatchDetailsUpdate(match, result.data);
      console.log('Match atualizado:', updatedMatch);
      setMessage({ 
        type: 'success', 
        text: `${result.message}. Form: ${result.data.teamAForm.length + result.data.teamBForm.length} jogos, H2H: ${result.data.h2hData.length} jogos` 
      });
      onDetailsUpdated(updatedMatch);
      setUrl(''); // Limpa o campo após sucesso
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
        <h2 className="text-lg font-semibold text-white">Importar Detalhes da Partida</h2>
      </div>

      {/* Campo de URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cole a URL da página de detalhes:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.academiadasapostasbrasil.com/stats/match/..."
            disabled={isUpdating}
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-600 disabled:cursor-not-allowed"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isUpdating && url.trim()) {
                handlePasteURL();
              }
            }}
          />
          <button
            onClick={handlePasteURL}
            disabled={isUpdating || !url.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            {isUpdating ? 'Processando...' : 'Buscar da URL'}
          </button>
        </div>
      </div>

      {/* Campo de URL de Competição (Opcional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          URL da página de competição/liga (opcional - para buscar estatísticas):
        </label>
        <input
          type="text"
          value={competitionUrl}
          onChange={(e) => setCompetitionUrl(e.target.value)}
          placeholder="https://www.academiadasapostasbrasil.com/stats/competition/..."
          disabled={isUpdating}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-600 disabled:cursor-not-allowed"
        />
        <p className="text-gray-400 text-xs mt-1">
          Se os dados de gols não forem encontrados na página de detalhes, o sistema buscará automaticamente na página de competição.
        </p>
      </div>

      {/* Botões alternativos */}
      <div className="flex items-center justify-between mb-4">
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
        💡 <strong>Dica:</strong> Se a URL não funcionar (erro 403), o site pode estar bloqueando requisições automáticas. Cole o HTML manualmente ou faça upload do arquivo .txt como alternativa.
      </p>
    </div>
  );
};

