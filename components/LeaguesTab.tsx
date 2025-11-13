import React, { useState, useEffect, useRef } from 'react';
import { loadLeagues, addLeague, updateLeague, deleteLeague, findLeagueByName, type League } from '../services/leagueService';
import { processCompetitionHTML, scrapeCompetitionFromURL, type CompetitionData } from '../services/competitionService';
import { Card } from './Card';
import type { MatchDetails } from '../types';

interface LeaguesTabProps {
  match: MatchDetails;
  onLeagueSelected?: (league: League) => void;
}

export const LeaguesTab: React.FC<LeaguesTabProps> = ({ match, onLeagueSelected }) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [competitionData, setCompetitionData] = useState<CompetitionData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<League>>({
    name: '',
    competitionUrl: '',
    statsUrl: '',
    country: '',
    season: '',
  });

  useEffect(() => {
    setLeagues(loadLeagues());
    
    // Tenta encontrar liga correspondente à competição do jogo
    if (match.matchInfo.competition) {
      const matchingLeague = findLeagueByName(match.matchInfo.competition);
      if (matchingLeague) {
        setFormData({
          name: matchingLeague.name,
          competitionUrl: matchingLeague.competitionUrl || '',
          statsUrl: matchingLeague.statsUrl || '',
          country: matchingLeague.country || '',
          season: matchingLeague.season || '',
        });
      } else {
        // Preenche com dados da competição atual
        setFormData(prev => ({
          ...prev,
          name: match.matchInfo.competition,
        }));
      }
    }
  }, [match]);

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('Nome da liga é obrigatório');
      return;
    }

    try {
      if (editingId) {
        const updated = updateLeague(editingId, formData);
        if (updated) {
          setLeagues(loadLeagues());
          setEditingId(null);
          setIsAdding(false);
          setFormData({ name: '', competitionUrl: '', statsUrl: '', country: '', season: '' });
        }
      } else {
        const newLeague = addLeague(formData as Omit<League, 'id' | 'createdAt' | 'updatedAt'>);
        setLeagues(loadLeagues());
        setIsAdding(false);
        setFormData({ name: '', competitionUrl: '', statsUrl: '', country: '', season: '' });
        
        // Se há callback, notifica a seleção
        if (onLeagueSelected) {
          onLeagueSelected(newLeague);
        }
      }
    } catch (error) {
      alert('Erro ao salvar liga: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleEdit = (league: League) => {
    setFormData({
      name: league.name,
      competitionUrl: league.competitionUrl || '',
      statsUrl: league.statsUrl || '',
      country: league.country || '',
      season: league.season || '',
    });
    setEditingId(league.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta liga?')) {
      if (deleteLeague(id)) {
        setLeagues(loadLeagues());
      }
    }
  };

  const handleUseLeague = (league: League) => {
    if (onLeagueSelected) {
      onLeagueSelected(league);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', competitionUrl: '', statsUrl: '', country: '', season: '' });
    setCompetitionData(null);
    setProcessMessage(null);
  };

  const handlePasteHTML = async () => {
    try {
      const html = await navigator.clipboard.readText();
      if (!html || html.trim().length === 0) {
        setProcessMessage({ type: 'error', text: 'Nenhum texto encontrado na área de transferência' });
        return;
      }

      setIsProcessing(true);
      setProcessMessage(null);

      const result = await processCompetitionHTML(html);
      
      if (result.success && result.data) {
        setCompetitionData(result.data);
        // Preenche o formulário com os dados extraídos
        setFormData({
          name: result.data.name,
          competitionUrl: result.data.url || formData.competitionUrl || '',
          statsUrl: formData.statsUrl || '',
          country: formData.country || '',
          season: formData.season || '',
        });
        setProcessMessage({ 
          type: 'success', 
          text: `${result.message}. ${result.data.standings.length} times encontrados na classificação.` 
        });
      } else {
        setProcessMessage({ type: 'error', text: 'Não foi possível extrair dados do HTML' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar HTML';
      setProcessMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessMessage(null);

    try {
      const text = await file.text();
      const result = await processCompetitionHTML(text);
      
      if (result.success && result.data) {
        setCompetitionData(result.data);
        setFormData({
          name: result.data.name,
          competitionUrl: result.data.url || formData.competitionUrl || '',
          statsUrl: formData.statsUrl || '',
          country: formData.country || '',
          season: formData.season || '',
        });
        setProcessMessage({ 
          type: 'success', 
          text: `${result.message}. ${result.data.standings.length} times encontrados na classificação.` 
        });
      } else {
        setProcessMessage({ type: 'error', text: 'Não foi possível extrair dados do arquivo' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar arquivo';
      setProcessMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleScrapeFromURL = async () => {
    const urlToUse = formData.competitionUrl?.trim();
    if (!urlToUse) {
      setProcessMessage({ type: 'error', text: 'Por favor, informe a URL da competição' });
      return;
    }

    try {
      new URL(urlToUse);
    } catch {
      setProcessMessage({ type: 'error', text: 'URL inválida' });
      return;
    }

    setIsProcessing(true);
    setProcessMessage(null);

    try {
      const result = await scrapeCompetitionFromURL(urlToUse);
      
      if (result.success && result.data) {
        setCompetitionData(result.data);
        setFormData({
          name: result.data.name,
          competitionUrl: urlToUse,
          statsUrl: formData.statsUrl || '',
          country: formData.country || '',
          season: formData.season || '',
        });
        setProcessMessage({ 
          type: 'success', 
          text: `${result.message}. ${result.data.standings.length} times encontrados na classificação.` 
        });
      } else {
        setProcessMessage({ type: 'error', text: 'Não foi possível extrair dados da URL' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer scraping da URL';
      setProcessMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  // Sugestão baseada na competição do jogo atual
  const suggestedLeague = match.matchInfo.competition ? findLeagueByName(match.matchInfo.competition) : null;

  return (
    <div className="space-y-6">
      {/* Seção de importar dados da competição */}
      <Card title="Importar Dados da Competição" className="border border-purple-500/30">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Cole o HTML da página de competição ou faça upload de um arquivo para extrair automaticamente os dados da liga.
          </p>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handlePasteHTML}
              disabled={isProcessing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              {isProcessing ? 'Processando...' : 'Colar HTML da Área de Transferência'}
            </button>
            <label className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors cursor-pointer">
              {isProcessing ? 'Processando...' : 'Upload de Arquivo HTML'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.html"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
            <button
              onClick={handleScrapeFromURL}
              disabled={isProcessing || !formData.competitionUrl?.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              {isProcessing ? 'Processando...' : 'Buscar da URL'}
            </button>
          </div>

          {processMessage && (
            <div
              className={`p-3 rounded-md ${
                processMessage.type === 'success'
                  ? 'bg-green-900/50 border border-green-700 text-green-200'
                  : 'bg-red-900/50 border border-red-700 text-red-200'
              }`}
            >
              <p className="text-sm">{processMessage.text}</p>
            </div>
          )}

          {competitionData && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <h4 className="text-white font-semibold mb-2">Dados Extraídos:</h4>
              <p className="text-gray-300 text-sm mb-2">
                <strong>Nome:</strong> {competitionData.name}
              </p>
              <p className="text-gray-300 text-sm mb-2">
                <strong>Classificação:</strong> {competitionData.standings.length} times
              </p>
              {competitionData.standings.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <table className="w-full text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left p-1">Pos</th>
                        <th className="text-left p-1">Time</th>
                        <th className="text-center p-1">Pts</th>
                        <th className="text-center p-1">J</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitionData.standings.slice(0, 10).map((standing) => (
                        <tr key={standing.position} className="border-b border-gray-700">
                          <td className="p-1">{standing.position}</td>
                          <td className="p-1">{standing.team}</td>
                          <td className="text-center p-1">{standing.points}</td>
                          <td className="text-center p-1">{standing.played}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-gray-400 text-xs mt-2">
                💡 Os dados foram preenchidos automaticamente no formulário abaixo. Revise e salve a liga.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Formulário de adicionar/editar */}
      {isAdding && (
        <Card title={editingId ? 'Editar Liga' : 'Adicionar Nova Liga'} className="border border-blue-500/30">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome da Liga *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Brasileirão Série A"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL da Página de Competição
              </label>
              <input
                type="text"
                value={formData.competitionUrl || ''}
                onChange={(e) => setFormData({ ...formData, competitionUrl: e.target.value })}
                placeholder="https://www.academiadasapostasbrasil.com/stats/competition/..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL de Estatísticas (opcional)
              </label>
              <input
                type="text"
                value={formData.statsUrl || ''}
                onChange={(e) => setFormData({ ...formData, statsUrl: e.target.value })}
                placeholder="https://www.academiadasapostasbrasil.com/stats/competition/.../statistics"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  País
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Ex: Brasil"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temporada
                </label>
                <input
                  type="text"
                  value={formData.season || ''}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  placeholder="Ex: 2024"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
              >
                {editingId ? 'Salvar Alterações' : 'Adicionar Liga'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Liga sugerida baseada na competição atual */}
      {!isAdding && suggestedLeague && (
        <Card title="Liga Sugerida" className="border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{suggestedLeague.name}</h3>
              {suggestedLeague.competitionUrl && (
                <p className="text-sm text-gray-400 mt-1">URL: {suggestedLeague.competitionUrl}</p>
              )}
            </div>
            <button
              onClick={() => handleUseLeague(suggestedLeague)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
            >
              Usar Esta Liga
            </button>
          </div>
        </Card>
      )}

      {/* Lista de ligas */}
      <Card title="Ligas Cadastradas" className="border border-gray-700">
        {leagues.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Nenhuma liga cadastrada. Clique em "Adicionar Liga" para começar.
          </p>
        ) : (
          <div className="space-y-3">
            {leagues.map((league) => (
              <div
                key={league.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{league.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-400">
                      {league.country && <p>País: {league.country}</p>}
                      {league.season && <p>Temporada: {league.season}</p>}
                      {league.competitionUrl && (
                        <p className="text-xs break-all">URL: {league.competitionUrl}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Criada em: {new Date(league.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleUseLeague(league)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                      title="Usar esta liga para preencher dados da partida"
                    >
                      Usar
                    </button>
                    <button
                      onClick={() => handleEdit(league)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(league.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
          >
            + Adicionar Nova Liga
          </button>
        )}
      </Card>
    </div>
  );
};

