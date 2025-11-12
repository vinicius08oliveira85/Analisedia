import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MatchList } from './components/MatchList';
import { MatchDetail } from './components/MatchDetail';
import { UpdateMatches } from './components/UpdateMatches';
import { fetchMatches } from './services/matchesService';
import { allMatchesData } from './data';
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

  // Carrega jogos salvos do localStorage ao iniciar
  useEffect(() => {
    try {
      const savedMatches = window.localStorage.getItem('updatedMatches');
      if (savedMatches) {
        const parsedMatches = JSON.parse(savedMatches);
        if (Array.isArray(parsedMatches) && parsedMatches.length > 0) {
          setMatches(parsedMatches);
        }
      }
    } catch (error) {
      console.error("Could not load matches from localStorage", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMatchesFromApi = async () => {
      try {
        const response = await fetchMatches();
        if (!isMounted) {
          return;
        }

        if (response.success && Array.isArray(response.matches) && response.matches.length > 0) {
          setMatches(response.matches);
          try {
            window.localStorage.setItem('updatedMatches', JSON.stringify(response.matches));
          } catch (error) {
            console.error('Não foi possível salvar os jogos atualizados no localStorage', error);
          }
        }
      } catch (error) {
        console.error('Não foi possível carregar os jogos a partir da API', error);
      }
    };

    loadMatchesFromApi();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMatchesUpdated = (updatedMatches: MatchDetails[]) => {
    // Salva no localStorage
    try {
      window.localStorage.setItem('updatedMatches', JSON.stringify(updatedMatches));
    } catch (error) {
      console.error("Could not save matches to localStorage", error);
    }
    setMatches(updatedMatches);
    setSelectedMatch(null); // Volta para a lista
  };

  const handleSelectMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedMatch && (
          <UpdateMatches onMatchesUpdated={handleMatchesUpdated} />
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
            matches={matches} 
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