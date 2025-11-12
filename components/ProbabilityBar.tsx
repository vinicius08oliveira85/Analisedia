import React from 'react';

interface Segment {
  value: number;
  label: string;
  color: string;
}

interface ProbabilityBarProps {
  segments: Segment[];
}

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({ segments }) => {
  return (
    <div className="w-full">
      <div className="flex w-full h-8 bg-gray-700 rounded-full overflow-hidden shadow-inner">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`flex items-center justify-center h-full transition-all duration-500 ${segment.color}`}
            style={{ width: `${segment.value}%` }}
            title={`${segment.label}: ${segment.value.toFixed(1)}%`}
          >
            <span className="text-white text-sm font-bold truncate px-2">
                {segment.value > 10 ? `${segment.value.toFixed(1)}%` : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center">
            <span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${segment.color}`}></span>
            <span>{segment.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
