import React, { useState, useRef } from 'react';
import {
  updateMatchesFromHTML,
  uploadMatchesFile,
  scrapeMatchesFromSite,
  type UpdateMatchesResponse,
  type ScrapeMatchesResponse,
} from '../services/matchesService';
import type { MatchDetails } from '../types';

interface UpdateMatchesProps {
  onMatchesUpdated: (matches: MatchDetails[]) => void;
}

export const UpdateMatches: React.FC<UpdateMatchesProps> = ({ onMatchesUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [siteUrls, setSiteUrls] = useState('https://www.academiadasapostasbrasil.com/');
  const [scrapeSummary, setScrapeSummary] = useState<Array<{ competition: string; count: number }>>([]);
  const [scrapeSources, setScrapeSources] = useState<ScrapeMatchesResponse['sources'] | null>(null);
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

  const handleScrapeFromSite = async () => {
    const urls = siteUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      setMessage({ type: 'error', text: 'Informe pelo menos uma URL do site para realizar o scraping.' });
      return;
    }

    setIsUpdating(true);
    setMessage(null);
    setScrapeSummary([]);
    setScrapeSources(null);

    try {
      const result: ScrapeMatchesResponse = await scrapeMatchesFromSite(urls);

      if (!result.success || result.matches.length === 0) {
        setMessage({
          type: 'error',
          text: result.message || 'Nenhum jogo encontrado nas URLs fornecidas.',
        });
        return;
      }

      onMatchesUpdated(result.matches);
      setMessage({
        type: 'success',
        text: `${result.message}${result.partial ? ' (Algumas URLs retornaram erro)' : ''}`,
      });
      setScrapeSummary(
        result.groupedByCompetition.map(group => ({
          competition: group.competition,
          count: group.count,
        }))
      );
      setScrapeSources(result.sources);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar dados diretamente do site';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Atualizar Jogos do Dia</h2>
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

      <div className="mt-4">
        <label htmlFor="site-urls" className="block text-sm font-medium text-gray-300 mb-2">
          URLs do site (uma por linha)
        </label>
        <textarea
          id="site-urls"
          value={siteUrls}
          onChange={(event) => setSiteUrls(event.target.value)}
          disabled={isUpdating}
          rows={4}
          className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-70"
          placeholder={`https://www.academiadasapostasbrasil.com/
https://www.academiadasapostasbrasil.com/stats/competitions/brasil/brasileirao-serie-a`}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">
            Informe páginas específicas do site para coletar os jogos automaticamente.
          </p>
          <button
            onClick={handleScrapeFromSite}
            disabled={isUpdating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            {isUpdating ? 'Buscando...' : 'Buscar Diretamente do Site'}
          </button>
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

      {scrapeSummary.length > 0 && (
        <div className="mt-4 bg-gray-900/60 border border-gray-700 rounded-md p-3">
          <p className="text-sm font-semibold text-white mb-2">Competições encontradas:</p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {scrapeSummary.map(summary => (
              <li key={summary.competition} className="flex items-center justify-between text-xs text-gray-300 bg-gray-800/60 rounded px-2 py-1">
                <span className="truncate pr-2">{summary.competition}</span>
                <span className="text-green-400 font-semibold">{summary.count}</span>
              </li>
            ))}
          </ul>
          {scrapeSources && scrapeSources.some(source => !source.success) && (
            <div className="mt-3 text-xs text-yellow-300">
              <p className="font-semibold mb-1">Avisos:</p>
              <ul className="space-y-1">
                {scrapeSources
                  .filter(source => !source.success)
                  .map(source => (
                    <li key={source.url}>
                      ⚠️ {source.url}: {source.error || 'Erro desconhecido'}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-gray-400 text-sm mt-3">
        💡 <strong>Dica:</strong> Você pode colar o HTML da página "Academia Jogos Do Dia", fazer upload do arquivo <code>.txt</code> ou informar URLs do site para coletar automaticamente.
      </p>
    </div>
  );
};

