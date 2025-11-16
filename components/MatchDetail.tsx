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
import { scrapeMatchDetailsFromURL, applyMatchDetailsUpdate } from '../services/matchDetailsService';
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
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

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

  // Scraping automático dos detalhes quando a página carrega (se tiver URL)
  useEffect(() => {
    const loadDetailsAutomatically = async () => {
      // Verifica se já tem dados completos (não são placeholders)
      const hasCompleteData = 
        currentMatch.h2hData.length > 0 || 
        currentMatch.teamAForm.length > 0 || 
        currentMatch.teamBForm.length > 0;

      // Se já tem dados completos ou não tem URL, não faz scraping
      if (hasCompleteData || !currentMatch.matchInfo.url) {
        return;
      }

      setIsLoadingDetails(true);
      setDetailsError(null);

      try {
        const result = await scrapeMatchDetailsFromURL(
          currentMatch.matchInfo.url,
          currentMatch.id
        );

        if (result.success && result.data) {
          const updatedMatch = applyMatchDetailsUpdate(currentMatch, result.data);
          setCurrentMatch(updatedMatch);
        }
      } catch (error) {
        let errorMessage = 'Erro ao carregar detalhes';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Melhora mensagens de erro comuns
          if (errorMessage.includes('403') || errorMessage.includes('Acesso negado')) {
            errorMessage = 'O site está bloqueando requisições automáticas. Use a aba "Configurações" para colar o HTML manualmente.';
          } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
            errorMessage = 'A requisição demorou muito. Tente novamente ou use a opção de colar HTML manualmente na aba "Configurações".';
          } else if (errorMessage.includes('404')) {
            errorMessage = 'Página não encontrada. A URL do jogo pode estar incorreta.';
          }
        }
        
        setDetailsError(errorMessage);
        console.error('Erro ao carregar detalhes automaticamente:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadDetailsAutomatically();
  }, [match.id]); // Executa apenas uma vez quando o match muda

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
        {isLoadingDetails && (
          <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-400"></div>
              <p className="text-blue-200 text-[10px] sm:text-xs">Carregando detalhes...</p>
            </div>
          </div>
        )}
        {detailsError && (
          <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
            <p className="text-yellow-200 text-[10px] sm:text-xs font-semibold mb-1">
              ⚠️ Erro ao carregar detalhes automaticamente
            </p>
            <p className="text-yellow-200 text-[10px] sm:text-xs mb-2">
              {detailsError}
            </p>
            <p className="text-yellow-300 text-[9px] sm:text-[10px] mt-1 border-t border-yellow-700/50 pt-1.5 mb-2">
              💡 <strong>Solução:</strong> Acesse a aba "Configurações" para:
              <br />• Colar o HTML da página manualmente
              <br />• Fazer upload de um arquivo HTML
              <br />• Atualizar os detalhes do jogo
            </p>
            {(detailsError.includes('403') || detailsError.includes('Acesso negado') || detailsError.includes('bloqueando')) && (
              <button
                onClick={() => setActiveTab('Configurações')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-semibold py-1.5 px-3 rounded text-[10px] sm:text-xs transition-colors duration-200 flex items-center justify-center gap-1.5 touch-manipulation"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  minHeight: '36px',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ir para Configurações
              </button>
            )}
          </div>
        )}
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