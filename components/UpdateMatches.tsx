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
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
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

      // Método padrão (academiadasapostasbrasil)
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
      console.error('Erro ao fazer scraping:', error);
      let errorMessage = 'Erro ao fazer scraping do site';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }

      // Tenta extrair detalhes da resposta se disponível
      if (error && typeof error === 'object' && 'details' in error) {
        errorMessage = `${errorMessage}: ${error.details}`;
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };


  const handleScrapeFromCustomURL = async () => {
    if (!customUrl.trim()) {
      setMessage({ type: 'error', text: 'Por favor, informe uma URL' });
      return;
    }

    // Valida se é uma URL válida
    try {
      new URL(customUrl.trim());
    } catch {
      setMessage({ type: 'error', text: 'URL inválida. Por favor, informe uma URL válida.' });
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      // Usa apenas academiadasapostasbrasil.com
      const result = await scrapeMatchesFromSite(customUrl.trim());

      const leaguesCount = Array.isArray(result.leagues) ? result.leagues.length : (result.leagueGroups?.length || 0);
      setMessage({
        type: 'success',
        text: `${result.message}. ${leaguesCount} liga(s) encontrada(s).`
      });
      onMatchesUpdated(result.matches);
      if (onLeaguesUpdated && result.leagueGroups && result.leagueGroups.length > 0) {
        onLeaguesUpdated(result.leagueGroups);
      } else if (onLeaguesUpdated && result.leagues && result.leagues.length > 0) {
        onLeaguesUpdated(result.leagues);
      }
      setCustomUrl(''); // Limpa o campo após sucesso
      setShowUrlInput(false);
    } catch (error) {
      console.error('Erro ao fazer scraping da URL:', error);
      let errorMessage = 'Erro ao fazer scraping da URL';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }

      if (error && typeof error === 'object' && 'details' in error) {
        errorMessage = `${errorMessage}: ${error.details}`;
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-md p-2 sm:p-3 mb-3 sm:mb-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-white">Atualizar Jogos</h2>
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            onTouchEnd={(e) => {
              if (!isUpdating) {
                e.preventDefault();
                setShowUrlInput(!showUrlInput);
              }
            }}
            disabled={isUpdating}
            className="px-3 py-2 sm:px-2 sm:py-1 sm:px-3 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-[10px] sm:text-xs font-medium transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
            title="Importar partidas através de uma URL customizada"
          >
            {showUrlInput ? '✕' : '🔗 URL'}
          </button>
          <button
            onClick={handleScrapeSite}
            onTouchEnd={(e) => {
              if (!isUpdating) {
                e.preventDefault();
                handleScrapeSite();
              }
            }}
            disabled={isUpdating}
            className="px-3 py-2 sm:px-2 sm:py-1 sm:px-3 sm:py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-[10px] sm:text-xs font-medium transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
            title="Faz scraping direto do site academiadasapostasbrasil.com"
          >
            {isUpdating ? '...' : '🔄 Site'}
          </button>
          <button
            onClick={handlePasteHTML}
            onTouchEnd={(e) => {
              if (!isUpdating) {
                e.preventDefault();
                handlePasteHTML();
              }
            }}
            disabled={isUpdating}
            className="px-3 py-2 sm:px-2 sm:py-1 sm:px-3 sm:py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-[10px] sm:text-xs font-medium transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
          >
            {isUpdating ? '...' : '📋 HTML'}
          </button>
          <label 
            className="px-3 py-2 sm:px-2 sm:py-1 sm:px-3 sm:py-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-[10px] sm:text-xs font-medium transition-colors cursor-pointer touch-manipulation inline-block"
            style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isUpdating ? '...' : '📁 File'}
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

      {/* Campo de URL customizada */}
      {showUrlInput && (
        <div className="mb-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
            Cole a URL do site para importar partidas:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://www.academiadasapostasbrasil.com/..."
              disabled={isUpdating}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-600 disabled:cursor-not-allowed text-xs sm:text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isUpdating && customUrl.trim()) {
                  handleScrapeFromCustomURL();
                }
              }}
            />
                <button
                  onClick={handleScrapeFromCustomURL}
                  onTouchEnd={(e) => {
                    if (!isUpdating && customUrl.trim()) {
                      e.preventDefault();
                      handleScrapeFromCustomURL();
                    }
                  }}
                  disabled={isUpdating || !customUrl.trim()}
                  className="px-4 py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                >
                  {isUpdating ? 'Processando...' : 'Importar'}
                </button>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            💡 Suporta: academiadasapostasbrasil.com
          </p>
        </div>
      )}

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

      <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
        <p className="text-blue-200 text-sm font-semibold mb-2">📋 Como copiar HTML do academiadasapostasbrasil.com:</p>
        <ol className="text-blue-100 text-xs space-y-1 list-decimal list-inside ml-2">
          <li>Abra <code className="bg-blue-900/50 px-1 rounded">https://www.academiadasapostasbrasil.com/</code> e aguarde os jogos carregarem</li>
          <li>Pressione <kbd className="bg-gray-700 px-1 rounded">F12</kbd> para abrir DevTools</li>
          <li>Vá na aba <strong>"Elements"</strong> (Elementos)</li>
          <li>Clique em <code className="bg-blue-900/50 px-1 rounded">&lt;html&gt;</code> ou <code className="bg-blue-900/50 px-1 rounded">&lt;body&gt;</code></li>
          <li>Botão direito → <strong>"Copy"</strong> → <strong>"Copy outerHTML"</strong></li>
          <li>Cole aqui usando o botão <strong>"📋 HTML"</strong></li>
        </ol>
        <p className="text-blue-200 text-xs mt-2">
          💡 <strong>Alternativa:</strong> No Console (F12), digite: <code className="bg-blue-900/50 px-1 rounded">copy(document.documentElement.outerHTML)</code>
        </p>
      </div>

      <p className="text-gray-400 text-sm mt-3">
        💡 <strong>Dica:</strong> Se "Buscar do Site" não funcionar (erro 403), o site pode estar bloqueando requisições automáticas. Use "Colar HTML" ou "Upload de Arquivo" como alternativa.
      </p>
    </div>
  );
};

