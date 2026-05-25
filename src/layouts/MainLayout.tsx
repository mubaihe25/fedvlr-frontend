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
  <div className="min-h-screen bg-[linear-gradient(135deg,#020617_0%,#020617_42%,#08111f_100%)] text-on-surface selection:bg-cyan-300/30 selection:text-cyan-100">
    <Sidebar currentPage={currentPage} onPageChange={onPageChange} />

    <main className="flex min-h-screen flex-col pl-64">
      <TopBar currentPage={currentPage} onPageChange={onPageChange} title={title} />

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar lg:p-8">
        <div className="mx-auto max-w-[1680px]">
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
