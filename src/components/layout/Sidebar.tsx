import React from 'react';
import {Blocks, Home, Shield, Swords} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {PageType} from '../../types/common';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

const mainNav: Array<{id: PageType; label: string; step: string; helper: string; icon: React.ComponentType<{className?: string}>}> = [
  {id: 'home', label: '项目导览', step: '01', helper: '快速理解平台目标', icon: Home},
  {id: 'systemMechanism', label: '系统机制', step: '02', helper: '联邦推荐如何工作', icon: Blocks},
  {id: 'attackDefenseRange', label: '攻防工作台', step: '03', helper: '编排、监控、分析、对比', icon: Swords},
];

const mechanismPages: PageType[] = ['systemMechanism', 'architecture', 'dataFusion', 'clientPersonalization'];
const workbenchPages: PageType[] = [
  'attackDefenseRange',
  'console',
  'monitoring',
  'analysis',
  'comparison',
  'history',
  'experimentResults',
  'deliveryReport',
  'resultsEvidence',
];

const isMainActive = (id: PageType, currentPage: PageType) => {
  if (id === 'systemMechanism') {
    return mechanismPages.includes(currentPage);
  }
  if (id === 'attackDefenseRange') {
    return workbenchPages.includes(currentPage);
  }
  return id === currentPage;
};

export const Sidebar: React.FC<SidebarProps> = ({currentPage, onPageChange}) => (
  <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.76),rgba(30,41,59,0.58))] shadow-[0_18px_55px_rgba(15,23,42,0.22)] backdrop-blur-2xl">
    <div className="px-6 pb-5 pt-7">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/35 bg-cyan-200/14">
        <Shield className="h-5 w-5 text-cyan-100" />
      </div>
      <h1 className="text-base font-bold leading-6 text-slate-50">安全推荐演示平台</h1>
      <p className="mt-2 text-xs leading-5 text-slate-300">按演示理解顺序组织：导览、机制、攻防工作台。</p>
    </div>

    <nav className="flex-1 space-y-2 px-4">
      {mainNav.map((item) => {
        const isActive = isMainActive(item.id, currentPage);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPageChange(item.id)}
            className={cn(
              'group w-full rounded-2xl px-3.5 py-3 text-left transition-all duration-200',
              isActive
                ? 'bg-white/16 text-white shadow-[0_10px_28px_rgba(56,189,248,0.12)] ring-1 ring-cyan-200/35'
                : 'text-slate-300 hover:bg-white/10 hover:text-white',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border text-[11px] font-bold',
                  isActive ? 'border-cyan-200/50 bg-cyan-200/18 text-cyan-50' : 'border-white/12 bg-white/7 text-slate-300',
                )}
              >
                {item.step}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <item.icon className={cn('h-4 w-4', isActive ? 'text-cyan-100' : 'text-slate-300 group-hover:text-cyan-100')} />
                  <span className="font-semibold">{item.label}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">{item.helper}</p>
              </div>
            </div>
          </button>
        );
      })}
    </nav>

    <div className="px-5 pb-5 text-[11px] leading-5 text-slate-400">
      攻防工作台内已合并实验编排、运行监控、单次分析、横向对比和历史实验。
    </div>
  </aside>
);
