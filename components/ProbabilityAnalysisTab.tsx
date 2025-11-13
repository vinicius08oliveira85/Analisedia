import React, { useState, useMemo } from 'react';
import type { MatchDetails, ProbabilityAnalysis } from '../types';
import { calculateProbabilities } from '../services/probabilityService';
import { Card } from './Card';
import { ProbabilityBar } from './ProbabilityBar';

type Scope = 'Contextual' | 'Global';

export const ProbabilityAnalysisTab: React.FC<{ match: MatchDetails }> = ({ match }) => {
    const [scope, setScope] = useState<Scope>('Contextual');

    const probabilities = useMemo(
        () => calculateProbabilities(match, scope),
        [match, scope]
    );

    const getButtonClass = (buttonScope: Scope) => {
      const base = "w-1/2 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded focus:outline-none transition-all duration-300";
      if (scope === buttonScope) {
          return `${base} bg-green-500 text-white shadow-lg`;
      }
      return `${base} bg-transparent text-gray-300 hover:bg-gray-600`;
    }

    const teamAScopeName = scope === 'Contextual' ? `(${match.teamA.name} como Mandante)` : `(${match.teamA.name} em Geral)`;
    const teamBScopeName = scope === 'Contextual' ? `(${match.teamB.name} como Visitante)` : `(${match.teamB.name} em Geral)`;

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 items-center">
                <Card title="Gols Esperados (xG)">
                    <div className="flex justify-around items-center text-center p-2 sm:p-3">
                        <div className="w-2/5">
                            <img src={match.teamA.logo} alt={match.teamA.name} className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1 sm:mb-1.5"/>
                            <p className="text-2xl sm:text-3xl font-bold text-white">{probabilities.expectedGoalsA.toFixed(2)}</p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400">{teamAScopeName}</p>
                        </div>
                        <div className="text-gray-500 font-light text-lg sm:text-xl">vs</div>
                        <div className="w-2/5">
                            <img src={match.teamB.logo} alt={match.teamB.name} className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1 sm:mb-1.5"/>
                            <p className="text-2xl sm:text-3xl font-bold text-white">{probabilities.expectedGoalsB.toFixed(2)}</p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400">{teamBScopeName}</p>
                        </div>
                    </div>
                </Card>
                <Card title="Probabilidade de Gols">
                     <div className="space-y-3 sm:space-y-4 p-2 sm:p-3">
                        <ProbabilityBar segments={[
                            { label: 'Mais de 1.5', value: probabilities.over1_5, color: 'bg-green-600' },
                            { label: 'Menos de 1.5', value: probabilities.under1_5, color: 'bg-red-600' }
                        ]}/>
                        <div className="text-[9px] sm:text-[10px] text-center text-gray-500">
                           Calculado com base nos gols esperados de ambas as equipes.
                        </div>
                    </div>
                </Card>
            </div>
            
            <Card title="Probabilidade de Resultado (1X2)">
                 <div className="p-2 sm:p-3">
                    <ProbabilityBar segments={[
                        { label: match.teamA.name, value: probabilities.homeWin, color: 'bg-blue-600' },
                        { label: 'Empate', value: probabilities.draw, color: 'bg-yellow-600' },
                        { label: match.teamB.name, value: probabilities.awayWin, color: 'bg-red-600' }
                    ]}/>
                 </div>
            </Card>

            <div className="text-[9px] sm:text-[10px] text-center text-gray-600 pt-2 sm:pt-3">
                <p><strong>Aviso:</strong> As probabilidades são calculadas com base em um modelo estatístico (Distribuição de Poisson) e dados históricos. Elas servem como uma referência e não garantem resultados futuros.</p>
            </div>
        </div>
    );
};
