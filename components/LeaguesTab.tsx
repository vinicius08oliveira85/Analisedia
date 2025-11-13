import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import type { League, MatchDetails } from '../types';
import { getLeagues, saveLeague, deleteLeague } from '../services/leagueService';

interface LeaguesTabProps {
  currentMatch?: MatchDetails; // Opcional - para sincronizar com partida atual
  onLeagueSelected?: (league: League) => void; // Callback quando uma liga é selecionada
}

export const LeaguesTab: React.FC<LeaguesTabProps> = ({ currentMatch, onLeagueSelected }) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<League>>({
    name: '',
    competitionUrl: '',
    country: '',
    season: '',
    notes: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(
    currentMatch ? findLeagueForMatch(currentMatch, leagues)?.id || null : null
  );

  useEffect(() => {
    loadLeagues();
  }, []);

  useEffect(() => {
    if (currentMatch && leagues.length > 0) {
      const matchingLeague = findLeagueForMatch(currentMatch, leagues);
      if (matchingLeague) {
        setSelectedLeagueId(matchingLeague.id);
      }
    }
  }, [currentMatch, leagues]);

  function findLeagueForMatch(match: MatchDetails, leaguesList: League[]): League | null {
    const competitionName = match.matchInfo.competition.toLowerCase();
    return leaguesList.find(league => 
      league.name.toLowerCase() === competitionName ||
      competitionName.includes(league.name.toLowerCase()) ||
      league.name.toLowerCase().includes(competitionName)
    ) || null;
  }

  const loadLeagues = () => {
    const savedLeagues = getLeagues();
    setLeagues(savedLeagues);
  };

  const handleSave = () => {
    if (!formData.name || formData.name.trim() === '') {
      setMessage({ type: 'error', text: 'O nome da liga é obrigatório' });
      return;
    }

    try {
      const league: League = editingId 
        ? {
            ...leagues.find(l => l.id === editingId)!,
            ...formData,
            name: formData.name!,
            updatedAt: new Date().toISOString()
          }
        : {
            id: `league-${Date.now()}`,
            name: formData.name!,
            competitionUrl: formData.competitionUrl || undefined,
            country: formData.country || undefined,
            season: formData.season || undefined,
            notes: formData.notes || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

      saveLeague(league);
      loadLeagues();
      resetForm();
      setMessage({ type: 'success', text: editingId ? 'Liga atualizada com sucesso!' : 'Liga adicionada com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao salvar liga' });
    }
  };

  const handleEdit = (league: League) => {
    setFormData({
      name: league.name,
      competitionUrl: league.competitionUrl || '',
      country: league.country || '',
      season: league.season || '',
      notes: league.notes || ''
    });
    setEditingId(league.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta liga?')) {
      deleteLeague(id);
      loadLeagues();
      setMessage({ type: 'success', text: 'Liga excluída com sucesso!' });
    }
  };

  const handleSelect = (league: League) => {
    setSelectedLeagueId(league.id);
    if (onLeagueSelected) {
      onLeagueSelected(league);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      competitionUrl: '',
      country: '',
      season: '',
      notes: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSyncWithMatch = (league: League) => {
    if (currentMatch && onLeagueSelected) {
      onLeagueSelected(league);
      setMessage({ 
        type: 'success', 
        text: `Liga "${league.name}" sincronizada com a partida "${currentMatch.teamA.name} vs ${currentMatch.teamB.name}"` 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Gerenciar Ligas</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          {isAdding ? 'Cancelar' : '+ Adicionar Liga'}
        </button>
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

      {isAdding && (
        <Card title={editingId ? 'Editar Liga' : 'Nova Liga'} className="border border-blue-500/30">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome da Liga *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Brasileirão Série A, Premier League, etc."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL da Competição (opcional)
              </label>
              <input
                type="text"
                value={formData.competitionUrl}
                onChange={(e) => setFormData({ ...formData, competitionUrl: e.target.value })}
                placeholder="https://www.academiadasapostasbrasil.com/stats/competition/..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                URL da página de estatísticas da competição para buscar dados automaticamente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  País (opcional)
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Ex: Brasil, Inglaterra, etc."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temporada (opcional)
                </label>
                <input
                  type="text"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  placeholder="Ex: 2024, 2024/2025, etc."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionais sobre a liga..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                {editingId ? 'Atualizar' : 'Salvar'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Card>
      )}

      {currentMatch && (
        <Card title="Sincronização com Partida Atual" className="border border-purple-500/30">
          <div className="space-y-2">
            <p className="text-gray-300 text-sm">
              <strong>Partida:</strong> {currentMatch.teamA.name} vs {currentMatch.teamB.name}
            </p>
            <p className="text-gray-300 text-sm">
              <strong>Competição:</strong> {currentMatch.matchInfo.competition}
            </p>
            {selectedLeagueId && (
              <div className="mt-3 p-3 bg-green-900/30 border border-green-700 rounded-md">
                <p className="text-green-200 text-sm">
                  ✓ Liga sincronizada: {leagues.find(l => l.id === selectedLeagueId)?.name}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Ligas Cadastradas ({leagues.length})</h3>
        
        {leagues.length === 0 ? (
          <Card className="border border-gray-700">
            <p className="text-gray-400 text-center py-4">
              Nenhuma liga cadastrada. Clique em "Adicionar Liga" para começar.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map(league => (
              <Card 
                key={league.id} 
                className={`border ${
                  selectedLeagueId === league.id 
                    ? 'border-green-500 bg-green-900/10' 
                    : 'border-gray-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="text-lg font-semibold text-white">{league.name}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(league)}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(league.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {league.country && (
                    <p className="text-sm text-gray-400">
                      <strong>País:</strong> {league.country}
                    </p>
                  )}

                  {league.season && (
                    <p className="text-sm text-gray-400">
                      <strong>Temporada:</strong> {league.season}
                    </p>
                  )}

                  {league.competitionUrl && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">URL da Competição:</p>
                      <a
                        href={league.competitionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 break-all"
                      >
                        {league.competitionUrl.substring(0, 50)}...
                      </a>
                    </div>
                  )}

                  {league.notes && (
                    <p className="text-sm text-gray-400 italic">
                      {league.notes}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-700">
                    {currentMatch && (
                      <button
                        onClick={() => handleSyncWithMatch(league)}
                        className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        Sincronizar
                      </button>
                    )}
                    <button
                      onClick={() => handleSelect(league)}
                      className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        selectedLeagueId === league.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {selectedLeagueId === league.id ? 'Selecionada' : 'Selecionar'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

