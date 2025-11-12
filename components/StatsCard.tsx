
import React from 'react';

interface StatsCardProps {
    label: string;
    value: string | number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value }) => {
    return (
        <div className="bg-gray-700 rounded-lg p-4 text-center shadow-md">
            <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
            <p className="text-xs md:text-sm text-gray-400 mt-1">{label}</p>
        </div>
    );
};
