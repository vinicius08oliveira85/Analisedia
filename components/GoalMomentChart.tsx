
import React from 'react';

interface GoalMomentChartProps {
    scored: number[];
    conceded: number[];
}

const timeIntervals = ["0-15'", "16-30'", "31-45'", "46-60'", "61-75'", "76-90'"];

export const GoalMomentChart: React.FC<GoalMomentChartProps> = ({ scored, conceded }) => {
    const maxScored = Math.max(...scored, 1);
    const maxConceded = Math.max(...conceded, 1);

    return (
        <div className="bg-gray-700 p-4 rounded-lg">
            <h5 className="text-md font-semibold mb-4 text-center text-gray-300">Momento dos Gols</h5>
            <div className="space-y-4">
                {timeIntervals.map((interval, index) => (
                    <div key={interval} className="grid grid-cols-3 gap-2 items-center text-xs">
                        <div className="text-right">
                            <span className="font-bold text-green-400">{scored[index]}</span>
                            <div className="bg-gray-600 rounded-full h-2.5 w-full mt-1 overflow-hidden flex justify-end">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(scored[index] / maxScored) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="text-center text-gray-400 font-medium">{interval}</div>
                        <div className="text-left">
                            <span className="font-bold text-red-400">{conceded[index]}</span>
                            <div className="bg-gray-600 rounded-full h-2.5 w-full mt-1 overflow-hidden">
                                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(conceded[index] / maxConceded) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-xs mt-4 text-gray-400 px-2">
                <span>Marcados</span>
                <span>Sofridos</span>
            </div>
        </div>
    );
};
