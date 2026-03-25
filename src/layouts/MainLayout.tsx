import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { PageType } from '../types/common';
import { motion, AnimatePresence } from 'motion/react';

interface MainLayoutProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  title: string;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPage,
  onPageChange,
  title,
  children,
}) => {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary/30 selection:text-primary">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      
      <main className="pl-64 min-h-screen flex flex-col">
        <TopBar 
          currentPage={currentPage} 
          onPageChange={onPageChange} 
          title={title}
        />
        
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Global Background Accents */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-64 w-[300px] h-[300px] bg-secondary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
};
