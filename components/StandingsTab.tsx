import React from 'react';
import type { Standing, TeamInfo } from '../types';

interface StandingsTabProps {
    standingsData: Standing[];
    teamA: TeamInfo;
    teamB: TeamInfo;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({ standingsData, teamA, teamB }) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-green-400">Classificação - Brasileirão Série A</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">P</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">J</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">V</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">E</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">D</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {standingsData.map((row: Standing) => {
              const isTeamA = row.team === teamA.name;
              const isTeamB = row.team === teamB.name;
              let rowClass = 'hover:bg-gray-700';
              if (isTeamA) {
                rowClass = 'bg-blue-900/50';
              } else if (isTeamB) {
                rowClass = 'bg-red-900/50';
              }
              
              return (
                <tr key={row.position} className={rowClass}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{row.position}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-white">{row.team}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.points}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.played}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.wins}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.draws}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.losses}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
