import React from 'react';
import { Tab } from '../types';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TABS: Tab[] = ['Visão Geral', 'Análise com IA', 'Probabilidades', 'Confronto Direto', 'Classificação', 'Análise de Gols', 'Ligas', 'Configurações'];

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tab: Tab) => {
    const baseClass = "px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors duration-200 cursor-pointer focus:outline-none whitespace-nowrap flex-shrink-0 touch-manipulation";
    if (tab === activeTab) {
      return `${baseClass} text-green-400 border-b-2 border-green-400`;
    }
    return `${baseClass} text-gray-400 hover:text-white border-b-2 border-transparent active:bg-gray-700`;
  };

  const handleTabClick = (tab: Tab, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Tab clicada:', tab);
    setActiveTab(tab);
  };

  return (
    <div className="bg-gray-800 rounded-t-md shadow-lg sticky top-10 sm:top-12 z-40" style={{ pointerEvents: 'auto' }}>
      <nav className="flex overflow-x-auto scrollbar-hide -mb-px" style={{ pointerEvents: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={getTabClass(tab)}
            onClick={(e) => handleTabClick(tab, e)}
            onTouchEnd={(e) => handleTabClick(tab, e)}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              minHeight: '44px',
              minWidth: '44px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 41
            }}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};
