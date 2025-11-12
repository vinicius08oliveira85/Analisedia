import React, { useState } from 'react';
import { MatchHeader } from './MatchHeader';
import { Tabs } from './Tabs';
import { OverviewTab } from './OverviewTab';
import { H2HTab } from './H2HTab';
import { StandingsTab } from './StandingsTab';
import { GoalAnalysisTab } from './GoalAnalysisTab';
import { GeminiAnalysis } from './GeminiAnalysis';
import { ProbabilityAnalysisTab } from './ProbabilityAnalysisTab';
import type { MatchDetails, Tab } from '../types';

interface MatchDetailProps {
  match: MatchDetails;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (matchId: string) => void;
}

export const MatchDetail: React.FC<MatchDetailProps> = ({ match, onBack, isFavorite, onToggleFavorite }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Visão Geral');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Visão Geral':
        return <OverviewTab 
                    teamA={match.teamA} 
                    teamB={match.teamB} 
                    teamAForm={match.teamAForm} 
                    teamBForm={match.teamBForm}
                    teamAStreaks={match.teamAStreaks}
                    teamBStreaks={match.teamBStreaks}
                    teamAOpponentAnalysis={match.teamAOpponentAnalysis}
                    teamBOpponentAnalysis={match.teamBOpponentAnalysis}
                />;
      case 'Análise com IA':
        return <GeminiAnalysis match={match} />;
      case 'Probabilidades':
        return <ProbabilityAnalysisTab match={match} />;
      case 'Confronto Direto':
        return <H2HTab h2hData={match.h2hData} />;
      case 'Classificação':
        return <StandingsTab standingsData={match.standingsData} teamA={match.teamA} teamB={match.teamB} />;
      case 'Análise de Gols':
        return <GoalAnalysisTab 
                    teamAGoalStats={match.teamAGoalStats} 
                    teamBGoalStats={match.teamBGoalStats} 
                    teamA={match.teamA} 
                    teamB={match.teamB}
                    teamAGoalPatterns={match.teamAGoalPatterns}
                    teamBGoalPatterns={match.teamBGoalPatterns}
                    teamACorrectScores={match.teamACorrectScores}
                    teamBCorrectScores={match.teamBCorrectScores}
                />;
      default:
        return <OverviewTab 
                    teamA={match.teamA} 
                    teamB={match.teamB} 
                    teamAForm={match.teamAForm} 
                    teamBForm={match.teamBForm}
                    teamAStreaks={match.teamAStreaks}
                    teamBStreaks={match.teamBStreaks}
                    teamAOpponentAnalysis={match.teamAOpponentAnalysis}
                    teamBOpponentAnalysis={match.teamBOpponentAnalysis}
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
        <MatchHeader 
          teamA={match.teamA} 
          teamB={match.teamB} 
          matchInfo={match.matchInfo} 
          matchId={match.id}
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