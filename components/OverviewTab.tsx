import React, { useState } from 'react';
import { MatchCard } from './MatchCard';
import type { TeamInfo, Match, TeamStreaks, OpponentAnalysisMatch, ScopedStats } from '../types';
import { Card } from './Card';

type Scope = 'Contextual' | 'Global';

interface OverviewTabProps {
  teamA: TeamInfo;
  teamB: TeamInfo;
  teamAForm: Match[];
  teamBForm: Match[];
  teamAStreaks: ScopedStats<TeamStreaks>;
  teamBStreaks: ScopedStats<TeamStreaks>;
  teamAOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]>;
  teamBOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]>;
}

const StreaksDisplay: React.FC<{ streaks: TeamStreaks, title: string }> = ({ streaks, title }) => (
    <Card title={title}>
        <div className="text-sm space-y-2 text-gray-300">
            <div className="flex justify-between"><span>Sequência de Vitórias:</span> <span className="font-bold text-white">{streaks.winStreak > 0 ? `${streaks.winStreak}J` : '-'}</span></div>
            <div className="flex justify-between"><span>Sequência de Empates:</span> <span className="font-bold text-white">{streaks.drawStreak > 0 ? `${streaks.drawStreak}J` : '-'}</span></div>
            <div className="flex justify-between"><span>Sequência de Derrotas:</span> <span className="font-bold text-white">{streaks.lossStreak > 0 ? `${streaks.lossStreak}J` : '-'}</span></div>
            <div className="flex justify-between pt-2 mt-2 border-t border-gray-700"><span>Jogos sem perder:</span> <span className="font-bold text-white">{streaks.unbeatenStreak > 0 ? `${streaks.unbeatenStreak}J` : '-'}</span></div>
            <div className="flex justify-between"><span>Jogos sem vencer:</span> <span className="font-bold text-white">{streaks.winlessStreak > 0 ? `${streaks.winlessStreak}J` : '-'}</span></div>
            <div className="flex justify-between"><span>Jogos sem empatar:</span> <span className="font-bold text-white">{streaks.noDrawStreak > 0 ? `${streaks.noDrawStreak}J` : '-'}</span></div>
        </div>
    </Card>
);

const OpponentAnalysisDisplay: React.FC<{ analysis: OpponentAnalysisMatch[], title: string, teamName: string }> = ({ analysis, title, teamName }) => {
    const getQuartile = (rank: number | string) => {
        const r = Number(rank);
        if (r <= 5) return 'bg-red-800/50'; // 1st Quartile (1-5)
        if (r <= 10) return 'bg-orange-800/50'; // 2nd Quartile (6-10)
        if (r <= 15) return 'bg-yellow-800/50'; // 3rd Quartile (11-15)
        return 'bg-green-800/50'; // 4th Quartile (16-20)
    };

    const getResultColor = (result: 'V' | 'E' | 'D') => {
        if (result === 'V') return 'bg-green-600';
        if (result === 'E') return 'bg-yellow-600';
        return 'bg-red-600';
    }

    return (
        <Card title={title} className="col-span-1 md:col-span-1">
             <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-xs text-gray-400 uppercase">
                        <tr>
                            <th className="p-2 text-left">Adv.</th>
                            <th className="p-2 text-center">Resultado</th>
                            <th className="p-2 text-center">Placar</th>
                            <th className="p-2 text-right">1º Gol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {analysis.slice(0, 10).map((match, index) => (
                            <tr key={index} className={`hover:bg-gray-700 ${getQuartile(match.opponentRank)}`}>
                                <td className="p-2 whitespace-nowrap"><span className="font-semibold">{match.opponentRank}º</span> {match.homeTeam === teamName ? match.awayTeam : match.homeTeam}</td>
                                <td className="p-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${getResultColor(match.result)}`}>
                                        {match.result}
                                    </span>
                                </td>
                                <td className="p-2 text-center font-mono">{match.score}</td>
                                <td className="p-2 text-right text-gray-400">{match.firstGoal}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};


export const OverviewTab: React.FC<OverviewTabProps> = ({ teamA, teamB, teamAForm, teamBForm, teamAStreaks, teamBStreaks, teamAOpponentAnalysis, teamBOpponentAnalysis }) => {
  const [scope, setScope] = useState<Scope>('Contextual');

  const teamAStreaksData = scope === 'Contextual' ? teamAStreaks.home : teamAStreaks.global;
  const teamBStreaksData = scope === 'Contextual' ? teamBStreaks.away : teamBStreaks.global;

  const teamAAnalysisData = scope === 'Contextual' ? teamAOpponentAnalysis.home : teamAOpponentAnalysis.global;
  const teamBAnalysisData = scope === 'Contextual' ? teamBOpponentAnalysis.away : teamBOpponentAnalysis.global;
  
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
            <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-green-400">Percurso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <StreaksDisplay streaks={teamAStreaksData} title={`${teamA.name} ${teamAContext}`} />
                <StreaksDisplay streaks={teamBStreaksData} title={`${teamB.name} ${teamBContext}`} />
            </div>
        </div>
      
        <div>
            <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-green-400">Análise (Últimos 10)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <OpponentAnalysisDisplay analysis={teamAAnalysisData} title={`${teamA.name} ${teamAContext}`} teamName={teamA.name} />
                <OpponentAnalysisDisplay analysis={teamBAnalysisData} title={`${teamB.name} ${teamBContext}`} teamName={teamB.name} />
            </div>
        </div>

      <div>
        <h3 className="text-xl font-bold mb-4 text-green-400">Últimos 10 Jogos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-2 text-center text-white">{teamA.name}</h4>
            {teamAForm.map((match, index) => (
              <MatchCard key={index} match={match} />
            ))}
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2 text-center text-white">{teamB.name}</h4>
            {teamBForm.map((match, index) => (
              <MatchCard key={index} match={match} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};