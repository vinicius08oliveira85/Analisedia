
import React from 'react';

interface StatsCardProps {
    label: string;
    value: string | number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value }) => {
    return (
        <div className="bg-gray-700 rounded-lg p-1.5 sm:p-2.5 text-center shadow-md">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{value}</p>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 sm:mt-1">{label}</p>
        </div>
    );
};
