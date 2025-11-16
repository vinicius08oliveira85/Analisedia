import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MatchList } from './components/MatchList';
import { MatchDetail } from './components/MatchDetail';
import { ConfigTab } from './components/ConfigTab';
import { LiveStatusControl } from './components/LiveStatusControl';
import { LeaguesView } from './components/LeaguesView';
import { useLiveStatusPolling } from './hooks/useLiveStatusPolling';
import { allMatchesData } from './data';
import { filterTodayAndFutureMatches, cleanOldMatchesFromStorage } from './utils/dateUtils';
import type { MatchDetails } from './types';

const App: React.FC = () => {
  const [matches, setMatches] = useState<MatchDetails[]>(allMatchesData);
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
  const [leagues, setLeagues] = useState<Array<{ leagueName: string; matches: MatchDetails[] }>>([]);
  const [viewMode, setViewMode] = useState<'list' | 'leagues' | 'config'>('list');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const savedFavorites = window.localStorage.getItem('favoriteMatches');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      console.error("Could not load favorites from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('favoriteMatches', JSON.stringify(favorites));
    } catch (error) {
      console.error("Could not save favorites to localStorage", error);
    }
  }, [favorites]);

  // Limpa jogos antigos do localStorage ao iniciar
  useEffect(() => {
    cleanOldMatchesFromStorage();
  }, []);

  // Carrega jogos salvos do localStorage ao iniciar (apenas jogos de hoje/futuros)
  useEffect(() => {
    try {
      const savedMatches = window.localStorage.getItem('updatedMatches');
      if (savedMatches) {
        const parsedMatches = JSON.parse(savedMatches);
        if (Array.isArray(parsedMatches) && parsedMatches.length > 0) {
          // Filtra apenas jogos de hoje ou futuros
          const filteredMatches = filterTodayAndFutureMatches(parsedMatches);
          if (filteredMatches.length > 0) {
            setMatches(filteredMatches);
          } else {
            // Se não há jogos válidos, usa os dados padrão
            setMatches(allMatchesData);
          }
        }
      }
    } catch (error) {
      console.error("Could not load matches from localStorage", error);
    }
  }, []);

  const handleMatchesUpdated = (updatedMatches: MatchDetails[]) => {
    // Filtra apenas jogos de hoje ou futuros antes de salvar
    const filteredMatches = filterTodayAndFutureMatches(updatedMatches);
    
    // Salva no localStorage
    try {
      if (filteredMatches.length > 0) {
        window.localStorage.setItem('updatedMatches', JSON.stringify(filteredMatches));
      } else {
        // Se não há jogos válidos, remove do localStorage
        window.localStorage.removeItem('updatedMatches');
      }
    } catch (error) {
      console.error("Could not save matches to localStorage", error);
    }
    
    // Atualiza o estado e volta para a lista
    // Usa setTimeout para garantir que o DOM esteja pronto antes de permitir interações
    setSelectedMatch(null);
    setViewMode('list');
    // Atualiza matches após um pequeno delay para garantir que a UI esteja pronta
    setTimeout(() => {
      setMatches(filteredMatches.length > 0 ? filteredMatches : allMatchesData);
    }, 0);
  };

  const handleLeaguesUpdated = (updatedLeagues: Array<{ leagueName: string; matches: MatchDetails[] }>) => {
    // Filtra jogos de hoje/futuros em cada liga
    const filteredLeagues = updatedLeagues.map(league => ({
      leagueName: league.leagueName,
      matches: filterTodayAndFutureMatches(league.matches)
    })).filter(league => league.matches.length > 0);
    
    setLeagues(filteredLeagues);
    // Se há ligas, muda para visualização por ligas
    if (filteredLeagues.length > 0) {
      setViewMode('leagues');
    } else {
      setViewMode('list');
    }
  };

  const handleSelectMatch = (matchId: string) => {
    console.log('handleSelectMatch chamado com matchId:', matchId);
    console.log('todayMatches:', todayMatches.length, 'matches:', matches.length);
    
    // Primeiro, limpa a seleção anterior e o viewMode
    setViewMode('list');
    
    // Busca primeiro nos jogos filtrados, depois em todos
    const match = todayMatches.find(m => m.id === matchId) || matches.find(m => m.id === matchId);
    
    if (match) {
      console.log('Match encontrado:', match.teamA.name, 'vs', match.teamB.name);
      setSelectedMatch(match);
      // Scroll suave para o topo quando abrir os detalhes
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      console.warn('Jogo não encontrado:', matchId);
      console.warn('IDs disponíveis:', todayMatches.map(m => m.id), matches.map(m => m.id));
    }
  };

  const handleBackToList = () => {
    setSelectedMatch(null);
  };

  const handleToggleFavorite = (matchId: string) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.includes(matchId)) {
        return prevFavorites.filter(id => id !== matchId);
      } else {
        return [...prevFavorites, matchId];
      }
    });
  };

  // Filtra jogos para mostrar apenas os de hoje ou futuros
  const todayMatches = useMemo(() => {
    return filterTodayAndFutureMatches(matches);
  }, [matches]);

  // Polling automático para jogos ao vivo
  const liveMatches = todayMatches.filter(m => m.liveStatus?.isLive);
  const { isPolling, startPolling, stopPolling } = useLiveStatusPolling(
    todayMatches,
    handleMatchesUpdated,
    {
      intervalMs: 30000, // 30 segundos
      enabled: liveMatches.length > 0
    }
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans text-xs sm:text-sm">
      <Header />
      <main className="max-w-7xl mx-auto px-1.5 sm:px-3 lg:px-6 py-1.5 sm:py-3">
        {!selectedMatch && (
          <>
            <div className="mb-1.5 flex gap-1 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('list');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewMode('list');
                }}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium transition-colors active:opacity-70 touch-manipulation ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                  style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  minHeight: '44px',
                  minWidth: '44px',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
              >
                Lista
              </button>
              {leagues.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode('leagues');
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setViewMode('leagues');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium transition-colors active:opacity-70 touch-manipulation ${
                    viewMode === 'leagues'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  minHeight: '44px',
                  minWidth: '44px',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
                >
                  Ligas ({leagues.length})
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Botão Configuração clicado');
                  setViewMode('config');
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Botão Configuração tocado');
                  setViewMode('config');
                }}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium transition-colors active:opacity-70 touch-manipulation ${
                  viewMode === 'config'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                  style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  minHeight: '44px',
                  minWidth: '44px',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                ⚙️ Configuração
              </button>
            </div>
            {viewMode !== 'config' && (
              <LiveStatusControl
                isPolling={isPolling}
                onStart={startPolling}
                onStop={stopPolling}
                liveMatchesCount={liveMatches.length}
              />
            )}
          </>
        )}
        {selectedMatch ? (
          <MatchDetail 
            match={selectedMatch} 
            onBack={handleBackToList}
            isFavorite={favorites.includes(selectedMatch.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : viewMode === 'config' ? (
          <ConfigTab
            onMatchesUpdated={handleMatchesUpdated}
            onLeaguesUpdated={handleLeaguesUpdated}
          />
        ) : viewMode === 'leagues' && leagues.length > 0 ? (
          <LeaguesView
            leagues={leagues}
            onSelectMatch={handleSelectMatch}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <div style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}>
            <MatchList 
              matches={todayMatches} 
              onSelectMatch={handleSelectMatch}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}
      </main>
      <footer className="text-center py-1 text-gray-500 text-[10px] sm:text-xs">
        <p>Futibou Analytics</p>
      </footer>
    </div>
  );
};

export default App;