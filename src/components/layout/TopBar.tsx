import React from 'react';
import type {PageType} from '../../types/common';

interface TopBarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({title}) => (
  <header className="sticky right-0 top-0 z-30 flex min-h-16 w-full items-center border-b border-white/10 bg-slate-900/52 px-7 backdrop-blur-2xl">
    <div>
      <span className="text-base font-bold tracking-tight text-slate-100">{title}</span>
      <span className="ml-3 text-xs text-slate-400">演示主线：项目导览 → 系统机制 → 攻防工作台</span>
    </div>
  </header>
);
