import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PageType } from '../../types/common';

interface TopBarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ currentPage, onPageChange, title }) => {
  const tabs = [
    { id: 'console', label: '实验配置' },
    { id: 'monitoring', label: '运行监控' },
    { id: 'analysis', label: '结果分析' },
    { id: 'comparison', label: '对比分析' },
    { id: 'history', label: '历史实验' },
  ];

  const isConsolePage = ['console', 'monitoring', 'analysis', 'comparison', 'history'].includes(currentPage);

  return (
    <header className="sticky top-0 right-0 z-30 flex justify-between items-center px-8 w-full h-16 bg-surface/80 backdrop-blur-xl border-b border-surface-container-highest/50 font-sans font-medium">
      <div className="flex items-center gap-8">
        <span className="text-primary-container font-headline font-bold text-lg tracking-tight">{title}</span>
        {isConsolePage && (
          <nav className="flex gap-6 h-full items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onPageChange(tab.id as PageType)}
                className={cn(
                  "text-sm transition-all duration-200 relative py-5",
                  currentPage === tab.id 
                    ? "text-primary-container font-bold" 
                    : "text-on-surface/70 hover:text-primary"
                )}
              >
                {tab.label}
                {currentPage === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-container" />
                )}
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="搜索实验..." 
            className="bg-surface-container-highest border-none rounded-full py-1.5 px-4 pl-10 text-xs w-48 focus:ring-1 focus:ring-primary transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
        </div>
      </div>
    </header>
  );
};
