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
  {id: 'analysis', label: '单次分析'},
  {id: 'history', label: '历史实验'},
  {id: 'comparison', label: '横向对比'},
];

const developerPages: PageType[] = ['console', 'monitoring', 'history', 'comparison', 'analysis'];

export const TopBar: React.FC<TopBarProps> = ({currentPage, onPageChange, title}) => {
  const isDeveloperPage = developerPages.includes(currentPage);

  return (
    <header className="sticky right-0 top-0 z-30 flex min-h-16 w-full items-center border-b border-white/10 bg-slate-950/55 px-7 backdrop-blur-2xl">
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-base font-bold tracking-tight text-slate-100">{title}</span>
          <span className="ml-3 text-xs text-slate-500">评审主线：项目导览 → 系统机制 → 攻防实验 → 结果与证据</span>
        </div>
        {isDeveloperPage ? (
          <nav className="flex flex-wrap items-center gap-2">
            {developerTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onPageChange(tab.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  currentPage === tab.id
                    ? 'border-cyan-200/40 bg-cyan-200/12 text-cyan-100'
                    : 'border-white/10 bg-white/[0.04] text-slate-500 hover:text-slate-200',
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
