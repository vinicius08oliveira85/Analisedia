import React, { useState, useEffect } from 'react';
import { loadLeagues, addLeague, updateLeague, deleteLeague, findLeagueByName, type League } from '../services/leagueService';
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
  };

  // Sugestão baseada na competição do jogo atual
  const suggestedLeague = match.matchInfo.competition ? findLeagueByName(match.matchInfo.competition) : null;

  return (
    <div className="space-y-6">
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

