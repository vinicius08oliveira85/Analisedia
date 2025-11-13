import React from 'react';
import type { CardProps } from '../types';

export const Card: React.FC<CardProps> = ({ title, children, className }) => (
    <div className={`bg-gray-800 rounded-md shadow-lg p-1.5 sm:p-2.5 ${className}`}>
        <h4 className="text-xs sm:text-sm font-semibold mb-1.5 text-center text-gray-300 border-b border-gray-700 pb-1">{title}</h4>
        {children}
    </div>
);
