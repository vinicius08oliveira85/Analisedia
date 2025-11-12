import React, { useState } from 'react';
import { MatchHeader } from './MatchHeader';
import { Tabs } from './Tabs';
import { OverviewTab } from './OverviewTab';
import { H2HTab } from './H2HTab';
import { StandingsTab } from './StandingsTab';
import { GoalAnalysisTab } from './GoalAnalysisTab';
import { GeminiAnalysis } from './GeminiAnalysis';
import { ProbabilityAnalysisTab } from './ProbabilityAnalysisTab';
import { UpdateMatchDetails } from './UpdateMatchDetails';
import type { MatchDetails, Tab } from '../types';

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

  return (
    <div>
        <button 
            onClick={onBack}
            className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Voltar para a lista de jogos
        </button>
        <UpdateMatchDetails match={currentMatch} onDetailsUpdated={handleDetailsUpdated} />
        <MatchHeader 
          teamA={currentMatch.teamA} 
          teamB={currentMatch.teamB} 
          matchInfo={currentMatch.matchInfo} 
          matchId={currentMatch.id}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
        <div className="mt-8">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-0 bg-gray-800 rounded-b-lg shadow-lg p-4 md:p-6">
                {renderTabContent()}
            </div>
        </div>
    </div>
  );
};