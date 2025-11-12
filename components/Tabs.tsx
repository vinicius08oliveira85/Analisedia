import React from 'react';
import { Tab } from '../types';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TABS: Tab[] = ['Visão Geral', 'Análise com IA', 'Probabilidades', 'Confronto Direto', 'Classificação', 'Análise de Gols'];

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tab: Tab) => {
    const baseClass = "px-4 py-3 text-sm md:text-base font-medium transition-colors duration-200 cursor-pointer focus:outline-none";
    if (tab === activeTab) {
      return `${baseClass} text-green-400 border-b-2 border-green-400`;
    }
    return `${baseClass} text-gray-400 hover:text-white border-b-2 border-transparent`;
  };

  return (
    <div className="bg-gray-800 rounded-t-lg shadow-lg">
      <nav className="flex flex-wrap -mb-px">
        {TABS.map(tab => (
          <button
            key={tab}
            className={getTabClass(tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};
