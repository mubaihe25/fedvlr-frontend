import React from 'react';
import { Cpu, Home, Shield, Terminal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PageType } from '../../types/common';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'console', label: '训练控制台', icon: Terminal },
    { id: 'architecture', label: '系统架构', icon: Cpu },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col z-40 bg-surface w-64 border-r border-surface-container-highest/30 shadow-[0_0_40px_rgba(129,236,255,0.04)] font-headline tracking-tight">
      <div className="p-8">
        <h1 className="text-xl font-bold text-primary tracking-widest uppercase">联邦推荐平台</h1>
        <p className="text-[10px] text-on-surface-variant mt-1 opacity-60">联邦推荐安全实验平台</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = item.id === 'console' 
            ? ['console', 'monitoring', 'analysis', 'comparison', 'history'].includes(currentPage)
            : currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id as PageType)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 ease-in-out rounded-lg group",
                isActive 
                  ? "text-primary bg-surface-container-highest border-l-4 border-primary-container shadow-[inset_0_0_12px_rgba(129,236,255,0.1)]" 
                  : "text-on-surface/60 hover:text-primary hover:bg-surface-container-highest/50 hover:backdrop-blur-sm"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-on-surface/60 group-hover:text-primary")} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-surface-container rounded-xl p-4 flex items-center gap-3 border border-outline-variant/10">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Admin Mode</p>
            <p className="text-[10px] text-on-surface-variant">Secure Session</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
