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
      <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-green-400">Classificação</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-[9px] sm:text-[10px] font-medium text-gray-300 uppercase">#</th>
              <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-[9px] sm:text-[10px] font-medium text-gray-300 uppercase">Time</th>
              <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-[9px] sm:text-[10px] font-medium text-gray-300 uppercase">P</th>
              <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-[9px] sm:text-[10px] font-medium text-gray-300 uppercase">J</th>
              <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-[9px] sm:text-[10px] font-medium text-gray-300 uppercase">V</th>
              <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-[9px] sm:text-[10px] font-medium text-gray-300 uppercase">E</th>
              <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-[9px] sm:text-[10px] font-medium text-gray-300 uppercase">D</th>
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
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[10px] sm:text-xs font-medium text-white">{row.position}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[10px] sm:text-xs font-semibold text-white">{row.team}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{row.points}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{row.played}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{row.wins}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{row.draws}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{row.losses}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
