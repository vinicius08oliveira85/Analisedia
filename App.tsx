import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MatchList } from './components/MatchList';
import { MatchDetail } from './components/MatchDetail';
import { UpdateMatches } from './components/UpdateMatches';
import { LiveStatusControl } from './components/LiveStatusControl';
import { useLiveStatusPolling } from './hooks/useLiveStatusPolling';
import { allMatchesData } from './data';
import { filterTodayAndFutureMatches, cleanOldMatchesFromStorage } from './utils/dateUtils';
import type { MatchDetails } from './types';

const App: React.FC = () => {
  const [matches, setMatches] = useState<MatchDetails[]>(allMatchesData);
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
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
    setMatches(filteredMatches.length > 0 ? filteredMatches : allMatchesData);
    setSelectedMatch(null); // Volta para a lista
  };

  const handleSelectMatch = (matchId: string) => {
    // Busca primeiro nos jogos filtrados, depois em todos
    const match = todayMatches.find(m => m.id === matchId) || matches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
    } else {
      console.warn('Jogo não encontrado:', matchId);
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
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedMatch && (
          <>
            <UpdateMatches onMatchesUpdated={handleMatchesUpdated} />
            <LiveStatusControl
              isPolling={isPolling}
              onStart={startPolling}
              onStop={stopPolling}
              liveMatchesCount={liveMatches.length}
            />
          </>
        )}
        {selectedMatch ? (
          <MatchDetail 
            match={selectedMatch} 
            onBack={handleBackToList}
            isFavorite={favorites.includes(selectedMatch.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <MatchList 
            matches={todayMatches} 
            onSelectMatch={handleSelectMatch}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Desenvolvido com React e Tailwind CSS. Dados atualizados via API.</p>
      </footer>
    </div>
  );
};

export default App;