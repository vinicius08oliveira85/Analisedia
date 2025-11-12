import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MatchList } from './components/MatchList';
import { MatchDetail } from './components/MatchDetail';
import { allMatchesData } from './data';
import type { MatchDetails } from './types';

const App: React.FC = () => {
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

  const handleSelectMatch = (matchId: string) => {
    const match = allMatchesData.find(m => m.id === matchId);
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
        {selectedMatch ? (
          <MatchDetail 
            match={selectedMatch} 
            onBack={handleBackToList}
            isFavorite={favorites.includes(selectedMatch.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <MatchList 
            matches={allMatchesData} 
            onSelectMatch={handleSelectMatch}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Desenvolvido com React e Tailwind CSS. Dados estáticos extraídos da web.</p>
      </footer>
    </div>
  );
};

export default App;