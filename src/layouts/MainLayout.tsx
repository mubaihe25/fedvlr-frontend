import React from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Sidebar} from '../components/layout/Sidebar';
import {TopBar} from '../components/layout/TopBar';
import type {PageType} from '../types/common';

interface MainLayoutProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  title: string;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({currentPage, onPageChange, title, children}) => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_24%_8%,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.12),transparent_28%),linear-gradient(135deg,#0f172a_0%,#111827_48%,#0b1220_100%)] text-on-surface selection:bg-cyan-300/30 selection:text-cyan-100">
    <Sidebar currentPage={currentPage} onPageChange={onPageChange} />

    <main className="flex min-h-screen flex-col pl-64">
      <TopBar currentPage={currentPage} onPageChange={onPageChange} title={title} />

      <div className="flex-1 overflow-y-auto p-5 no-scrollbar lg:p-7">
        <div className="mx-auto max-w-[1500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              transition={{duration: 0.25, ease: 'easeInOut'}}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  </div>
);
