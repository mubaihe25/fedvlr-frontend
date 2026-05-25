import React from 'react';
import {cn} from '../../lib/utils';
import type {PageType} from '../../types/common';

interface TopBarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  title: string;
}

const developerTabs: Array<{id: PageType; label: string}> = [
  {id: 'console', label: '训练配置'},
  {id: 'monitoring', label: '运行监控'},
  {id: 'history', label: '历史实验'},
  {id: 'comparison', label: '横向对比'},
  {id: 'analysis', label: '单次分析'},
];

const developerPages: PageType[] = ['console', 'monitoring', 'history', 'comparison', 'analysis'];

export const TopBar: React.FC<TopBarProps> = ({currentPage, onPageChange, title}) => {
  const isDeveloperPage = developerPages.includes(currentPage);

  return (
    <header className="sticky right-0 top-0 z-30 flex min-h-16 w-full items-center border-b border-slate-800/80 bg-slate-950/80 px-8 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-6">
        <span className="text-lg font-bold tracking-tight text-cyan-100">{title}</span>
        {isDeveloperPage ? (
          <nav className="flex flex-wrap items-center gap-2">
            {developerTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onPageChange(tab.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-bold transition',
                  currentPage === tab.id
                    ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
                    : 'border-slate-700/60 bg-slate-900/40 text-slate-400 hover:text-cyan-100',
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
};
