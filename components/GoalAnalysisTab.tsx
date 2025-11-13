import React, { useState } from 'react';
import type { TeamGoalStats, TeamInfo, GoalScoringPatterns, CorrectScore, ScopedStats } from '../types';
import { StatsCard } from './StatsCard';
import { GoalMomentChart } from './GoalMomentChart';
import { Card } from './Card';

type Scope = 'Contextual' | 'Global';

interface GoalAnalysisTabProps {
    teamAGoalStats: ScopedStats<TeamGoalStats>;
    teamBGoalStats: ScopedStats<TeamGoalStats>;
    teamA: TeamInfo;
    teamB: TeamInfo;
    teamAGoalPatterns: ScopedStats<GoalScoringPatterns>;
    teamBGoalPatterns: ScopedStats<GoalScoringPatterns>;
    teamACorrectScores: ScopedStats<{ ht: CorrectScore[], ft: CorrectScore[] }>;
    teamBCorrectScores: ScopedStats<{ ht: CorrectScore[], ft: CorrectScore[] }>;
}

const CorrectScoreDisplay: React.FC<{ htScores: CorrectScore[], ftScores: CorrectScore[], title: string }> = ({ htScores, ftScores, title }) => (
    <Card title={title}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            <div>
                <h5 className="text-[10px] sm:text-xs font-semibold text-center text-gray-400 mb-1.5">Intervalo</h5>
                <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs">
                    {htScores.map(cs => (
                        <div key={cs.score} className="flex justify-between items-center bg-gray-600/50 p-1 sm:p-1.5 rounded">
                            <span className="font-mono font-bold text-white">{cs.score}</span>
                            <span className="text-gray-300">{cs.count} {cs.count > 1 ? 'j' : 'j'}</span>
                            <span className="font-semibold text-green-400">{cs.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h5 className="text-[10px] sm:text-xs font-semibold text-center text-gray-400 mb-1.5">Final</h5>
                <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs">
                    {ftScores.map(cs => (
                        <div key={cs.score} className="flex justify-between items-center bg-gray-600/50 p-1 sm:p-1.5 rounded">
                            <span className="font-mono font-bold text-white">{cs.score}</span>
                            <span className="text-gray-300">{cs.count} {cs.count > 1 ? 'j' : 'j'}</span>
                            <span className="font-semibold text-green-400">{cs.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </Card>
);

const GoalScoringPatternsDisplay: React.FC<{ patterns: GoalScoringPatterns, title: string }> = ({ patterns, title }) => (
     <Card title={title}>
        <div className="text-[10px] sm:text-xs space-y-1.5 sm:space-2 text-gray-300">
            <div className="flex justify-between items-center">
                <span>Abre o placar:</span>
                <span className="font-bold text-white">{patterns.opensScore.pct}% ({patterns.opensScore.games}/{patterns.opensScore.total}j)</span>
            </div>
            <div className="flex justify-between items-center">
                <span>Vence ao abrir:</span>
                <span className="font-bold text-white">{patterns.winsWhenOpening.pct}% ({patterns.winsWhenOpening.games}/{patterns.winsWhenOpening.total}j)</span>
            </div>
            <div className="flex justify-between items-center">
                <span>Reviravoltas:</span>
                <span className="font-bold text-white">{patterns.comebacks.pct}% ({patterns.comebacks.games}/{patterns.comebacks.total}j)</span>
            </div>
        </div>
    </Card>
);


const GoalStatsDisplay: React.FC<{ stats: TeamGoalStats, teamName: string }> = ({ stats, teamName }) => (
    <div>
        <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-center text-white">{teamName}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <StatsCard label="Média Marcados" value={stats.avgGoalsScored.toFixed(2)} />
            <StatsCard label="Média Sofridos" value={stats.avgGoalsConceded.toFixed(2)} />
            <StatsCard label="Média Total" value={stats.avgTotalGoals.toFixed(2)} />
            <StatsCard label="> 2.5 Gols" value={`${stats.over25Pct}%`} />
            <StatsCard label="< 2.5 Gols" value={`${stats.under25Pct}%`} />
            <StatsCard label="s/ Marcar" value={`${stats.noGoalsScoredPct}%`} />
        </div>
        <GoalMomentChart 
            scored={stats.goalMoments.scored} 
            conceded={stats.goalMoments.conceded}
        />
    </div>
);

export const GoalAnalysisTab: React.FC<GoalAnalysisTabProps> = ({ teamAGoalStats, teamBGoalStats, teamA, teamB, teamAGoalPatterns, teamBGoalPatterns, teamACorrectScores, teamBCorrectScores }) => {
    const [scope, setScope] = useState<Scope>('Contextual');
    
    const teamAStats = scope === 'Contextual' ? teamAGoalStats.home : teamAGoalStats.global;
    const teamBStats = scope === 'Contextual' ? teamBGoalStats.away : teamBGoalStats.global;

    const teamAPatterns = scope === 'Contextual' ? teamAGoalPatterns.home : teamAGoalPatterns.global;
    const teamBPatterns = scope === 'Contextual' ? teamBGoalPatterns.away : teamBGoalPatterns.global;

    const teamAScores = scope === 'Contextual' ? teamACorrectScores.home : teamACorrectScores.global;
    const teamBScores = scope === 'Contextual' ? teamBCorrectScores.away : teamBCorrectScores.global;

    const teamAContext = scope === 'Contextual' ? '(Casa)' : '(Global)';
    const teamBContext = scope === 'Contextual' ? '(Fora)' : '(Global)';

    const getButtonClass = (buttonScope: Scope) => {
      const base = "w-1/2 px-4 py-2 text-sm font-semibold rounded-md focus:outline-none transition-all duration-300";
      if (scope === buttonScope) {
          return `${base} bg-green-500 text-white shadow-lg`;
      }
      return `${base} bg-transparent text-gray-300 hover:bg-gray-600`;
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-center mb-2 sm:mb-3 rounded-lg p-0.5 sm:p-1 bg-gray-900/50 border border-gray-700 w-full md:w-2/3 lg:w-1/2 mx-auto">
                <button onClick={() => setScope('Contextual')} className={getButtonClass('Contextual')}>
                    <span className="text-[10px] sm:text-xs">Mandante/Visitante</span>
                </button>
                <button onClick={() => setScope('Global')} className={getButtonClass('Global')}>
                    <span className="text-[10px] sm:text-xs">Global</span>
                </button>
            </div>
            <div>
                <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-green-400">Análise de Gols</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                    <GoalStatsDisplay stats={teamAStats} teamName={`${teamA.name} ${teamAContext}`} />
                    <GoalStatsDisplay stats={teamBStats} teamName={`${teamB.name} ${teamBContext}`} />
                </div>
            </div>
            <div>
                <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-green-400">Padrões de Gols</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                    <GoalScoringPatternsDisplay patterns={teamAPatterns} title={`${teamA.name} ${teamAContext}`}/>
                    <GoalScoringPatternsDisplay patterns={teamBPatterns} title={`${teamB.name} ${teamBContext}`}/>
                 </div>
            </div>
             <div>
                <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-green-400">Resultados Frequentes</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                    <CorrectScoreDisplay htScores={teamAScores.ht} ftScores={teamAScores.ft} title={`${teamA.name} ${teamAContext}`} />
                    <CorrectScoreDisplay htScores={teamBScores.ht} ftScores={teamBScores.ft} title={`${teamB.name} ${teamBContext}`} />
                 </div>
            </div>
        </div>
    );
};