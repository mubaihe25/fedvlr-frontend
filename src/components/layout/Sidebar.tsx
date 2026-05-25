import React from 'react';
import {BarChart3, FileText, Home, Shield, Swords, Terminal} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {PageType} from '../../types/common';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

const navItems: Array<{id: PageType; label: string; icon: React.ComponentType<{className?: string}>; helper: string}> = [
  {id: 'home', label: '系统总览', icon: Home, helper: '数字沙盘入口'},
  {id: 'attackDefenseRange', label: '攻防沙盘', icon: Swords, helper: '联邦攻防演练'},
  {id: 'experimentResults', label: '实验结果', icon: BarChart3, helper: 'artifact 摘要'},
  {id: 'deliveryReport', label: '交付报告', icon: FileText, helper: '评委结尾页'},
  {id: 'console', label: '开发者控制台', icon: Terminal, helper: '配置 / 监控 / 历史'},
];

const consolePages: PageType[] = ['console', 'monitoring', 'analysis', 'history', 'comparison'];

export const Sidebar: React.FC<SidebarProps> = ({currentPage, onPageChange}) => (
  <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-slate-800/80 bg-slate-950/92 shadow-[0_0_44px_rgba(8,47,73,0.34)] backdrop-blur-xl">
    <div className="p-7">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10">
        <Shield className="h-6 w-6 text-cyan-200" />
      </div>
      <h1 className="text-base font-bold leading-6 text-white">联邦推荐攻防沙盘</h1>
      <p className="mt-2 text-xs leading-5 text-slate-400">隐私安全推荐系统及其攻防验证平台</p>
    </div>

    <nav className="flex-1 space-y-2 px-4">
      {navItems.map((item) => {
        const isActive =
          item.id === 'console'
            ? consolePages.includes(currentPage)
            : item.id === 'experimentResults'
              ? currentPage === 'experimentResults'
              : currentPage === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPageChange(item.id)}
            className={cn(
              'group w-full rounded-2xl border px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5',
              isActive
                ? 'border-cyan-300/45 bg-cyan-300/10 text-cyan-50 shadow-[0_0_26px_rgba(34,211,238,0.14)]'
                : 'border-transparent text-slate-400 hover:border-slate-700/70 hover:bg-slate-900/80 hover:text-cyan-100',
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn('h-5 w-5', isActive ? 'text-cyan-200' : 'text-slate-500 group-hover:text-cyan-200')} />
              <span className="font-semibold">{item.label}</span>
            </div>
            <p className="ml-8 mt-1 text-[11px] text-slate-500">{item.helper}</p>
          </button>
        );
      })}
    </nav>

    <div className="p-5">
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
        <p className="text-xs font-bold text-emerald-100">演示边界</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">demo / smoke / proxy 只作 artifact 说明，不写成完整实现。</p>
      </div>
    </div>
  </aside>
);
