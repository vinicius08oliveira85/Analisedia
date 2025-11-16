import React, { useState, useEffect } from 'react';
import { MatchHeader } from './MatchHeader';
import { Tabs } from './Tabs';
import { OverviewTab } from './OverviewTab';
import { H2HTab } from './H2HTab';
import { StandingsTab } from './StandingsTab';
import { GoalAnalysisTab } from './GoalAnalysisTab';
import { GeminiAnalysis } from './GeminiAnalysis';
import { ProbabilityAnalysisTab } from './ProbabilityAnalysisTab';
import { SettingsTab } from './SettingsTab';
import { LeaguesTab } from './LeaguesTab';
import type { MatchDetails, Tab, LiveMatchStatus, MatchOdds } from '../types';
import type { League } from '../types/league';

interface MatchDetailProps {
  match: MatchDetails;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (matchId: string) => void;
}

export const MatchDetail: React.FC<MatchDetailProps> = ({ match, onBack, isFavorite, onToggleFavorite }) => {
  const [currentMatch, setCurrentMatch] = useState<MatchDetails>(match);
  const [activeTab, setActiveTab] = useState<Tab>('Visão Geral');

  const handleDetailsUpdated = (updatedMatch: MatchDetails) => {
    setCurrentMatch(updatedMatch);
  };

  const handleLiveStatusUpdated = (matchId: string, liveStatus?: LiveMatchStatus, odds?: MatchOdds) => {
    setCurrentMatch(prev => ({
      ...prev,
      liveStatus: liveStatus || prev.liveStatus,
      odds: odds || prev.odds
    }));
  };

  const handleLeagueSelected = (league: League) => {
    // Quando uma liga é selecionada, atualiza o componente UpdateMatchDetails
    // Isso será feito via ref ou state compartilhado
    console.log('Liga selecionada:', league);
    // Dispara evento customizado para o UpdateMatchDetails
    window.dispatchEvent(new CustomEvent('league-selected', { detail: league }));
  };

  // Scraping automático removido - agora só acontece quando o usuário solicitar manualmente
  // Use a aba "Configurações" para atualizar os detalhes quando quiser

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Visão Geral':
        return <OverviewTab 
                    teamA={currentMatch.teamA} 
                    teamB={currentMatch.teamB} 
                    teamAForm={currentMatch.teamAForm} 
                    teamBForm={currentMatch.teamBForm}
                    teamAStreaks={currentMatch.teamAStreaks}
                    teamBStreaks={currentMatch.teamBStreaks}
                    teamAOpponentAnalysis={currentMatch.teamAOpponentAnalysis}
                    teamBOpponentAnalysis={currentMatch.teamBOpponentAnalysis}
                />;
      case 'Análise com IA':
        return <GeminiAnalysis match={currentMatch} />;
      case 'Probabilidades':
        return <ProbabilityAnalysisTab match={currentMatch} />;
      case 'Confronto Direto':
        return <H2HTab h2hData={currentMatch.h2hData} />;
      case 'Classificação':
        return <StandingsTab standingsData={currentMatch.standingsData} teamA={currentMatch.teamA} teamB={currentMatch.teamB} />;
      case 'Análise de Gols':
        return <GoalAnalysisTab 
                    teamAGoalStats={currentMatch.teamAGoalStats} 
                    teamBGoalStats={currentMatch.teamBGoalStats} 
                    teamA={currentMatch.teamA} 
                    teamB={currentMatch.teamB}
                    teamAGoalPatterns={currentMatch.teamAGoalPatterns}
                    teamBGoalPatterns={currentMatch.teamBGoalPatterns}
                    teamACorrectScores={currentMatch.teamACorrectScores}
                    teamBCorrectScores={currentMatch.teamBCorrectScores}
                />;
      case 'Ligas':
        return <LeaguesTab 
                    match={currentMatch}
                    onLeagueSelected={handleLeagueSelected}
                />;
      case 'Configurações':
        return <SettingsTab 
                    match={currentMatch}
                    onDetailsUpdated={handleDetailsUpdated}
                    onStatusUpdated={handleLiveStatusUpdated}
                />;
      default:
        return <OverviewTab 
                    teamA={currentMatch.teamA} 
                    teamB={currentMatch.teamB} 
                    teamAForm={currentMatch.teamAForm} 
                    teamBForm={currentMatch.teamBForm}
                    teamAStreaks={currentMatch.teamAStreaks}
                    teamBStreaks={currentMatch.teamBStreaks}
                    teamAOpponentAnalysis={currentMatch.teamAOpponentAnalysis}
                    teamBOpponentAnalysis={currentMatch.teamBOpponentAnalysis}
                />;
    }
  };

  // Scroll para o topo quando o componente é montado
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [match.id]);

  return (
    <div style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}>
        <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBack();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBack();
            }}
            className="mb-2 sm:mb-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white font-semibold py-1 px-2 sm:py-1.5 sm:px-3 rounded text-[10px] sm:text-xs transition-colors duration-200 flex items-center touch-manipulation"
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Voltar
        </button>
        <MatchHeader 
          teamA={currentMatch.teamA} 
          teamB={currentMatch.teamB} 
          matchInfo={currentMatch.matchInfo} 
          matchId={currentMatch.id}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          liveStatus={currentMatch.liveStatus}
          odds={currentMatch.odds}
        />
        <div className="mt-3 sm:mt-4">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-0 bg-gray-800 rounded-b-lg shadow-lg p-2 sm:p-3 md:p-4">
                {renderTabContent()}
            </div>
        </div>
    </div>
  );
};