import React from 'react';
import {BarChart3, Blocks, Home, MonitorCog, Shield, Swords} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {PageType} from '../../types/common';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

const mainNav: Array<{id: PageType; label: string; step: string; helper: string; icon: React.ComponentType<{className?: string}>}> = [
  {id: 'home', label: '项目导览', step: '01', helper: '10 秒理解项目', icon: Home},
  {id: 'systemMechanism', label: '系统机制', step: '02', helper: '正常推荐系统如何工作', icon: Blocks},
  {id: 'attackDefenseRange', label: '攻防实验', step: '03', helper: '观察攻击、防御和推荐变化', icon: Swords},
  {id: 'resultsEvidence', label: '结果与证据', step: '04', helper: '实验结果、能力矩阵和边界', icon: BarChart3},
];

const developerNav: Array<{id: PageType; label: string}> = [
  {id: 'console', label: '训练配置'},
  {id: 'monitoring', label: '运行监控'},
  {id: 'analysis', label: '单次分析'},
  {id: 'history', label: '历史实验'},
  {id: 'comparison', label: '横向对比'},
];

const mechanismPages: PageType[] = ['systemMechanism', 'architecture', 'dataFusion', 'clientPersonalization'];
const evidencePages: PageType[] = ['resultsEvidence', 'experimentResults', 'deliveryReport'];
const isMainActive = (id: PageType, currentPage: PageType) => {
  if (id === 'systemMechanism') {
    return mechanismPages.includes(currentPage);
  }
  if (id === 'resultsEvidence') {
    return evidencePages.includes(currentPage);
  }
  return id === currentPage;
};

export const Sidebar: React.FC<SidebarProps> = ({currentPage, onPageChange}) => (
  <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/10 bg-slate-950/82 shadow-[0_18px_55px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
    <div className="px-6 pb-5 pt-7">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-200/12">
        <Shield className="h-5 w-5 text-cyan-100" />
      </div>
      <h1 className="text-base font-bold leading-6 text-slate-50">安全推荐系统演示平台</h1>
      <p className="mt-2 text-xs leading-5 text-slate-400">按评委理解顺序组织：导览、机制、攻防、证据。</p>
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
                ? 'bg-white/12 text-white shadow-[0_14px_34px_rgba(56,189,248,0.12)] ring-1 ring-cyan-200/25'
                : 'text-slate-400 hover:bg-white/7 hover:text-slate-100',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border text-[11px] font-bold',
                  isActive ? 'border-cyan-200/40 bg-cyan-200/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-500',
                )}
              >
                {item.step}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <item.icon className={cn('h-4 w-4', isActive ? 'text-cyan-100' : 'text-slate-500 group-hover:text-cyan-100')} />
                  <span className="font-semibold">{item.label}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.helper}</p>
              </div>
            </div>
          </button>
        );
      })}
    </nav>

    <div className="px-4 pb-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
          <MonitorCog className="h-3.5 w-3.5" />
          开发者模式
        </div>
        <div className="grid grid-cols-2 gap-2">
          {developerNav.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPageChange(item.id)}
                className={cn(
                  'rounded-xl border px-2.5 py-1.5 text-left text-[11px] transition',
                  isActive
                    ? 'border-cyan-200/30 bg-cyan-200/10 text-cyan-100'
                    : 'border-white/8 bg-slate-900/30 text-slate-500 hover:text-slate-200',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </aside>
);
