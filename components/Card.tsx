import React from 'react';
import type { CardProps } from '../types';

export const Card: React.FC<CardProps> = ({ title, children, className }) => (
    <div className={`bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}>
        <h4 className="text-lg font-semibold mb-3 text-center text-gray-300 border-b border-gray-700 pb-2">{title}</h4>
        {children}
    </div>
);
