import React, { useState } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Team } from './pages/Team';
import { Console } from './pages/console/Console';
import { PageType } from './types/common';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onPageChange={setCurrentPage} />;
      case 'team':
        return <Team />;
      case 'console':
      case 'monitoring':
      case 'analysis':
      case 'comparison':
      case 'history':
        return <Console currentPage={currentPage} />;
      default:
        return <Home onPageChange={setCurrentPage} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'home': return 'Cyber Sentinel - 首页';
      case 'team': return '关于团队';
      case 'console': return '训练控制台';
      case 'monitoring': return '实时监控';
      case 'analysis': return '结果分析';
      case 'comparison': return '对比分析';
      case 'history': return '历史实验';
      default: return 'Cyber Sentinel';
    }
  };

  return (
    <MainLayout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage} 
      title={getPageTitle()}
    >
      {renderPage()}
    </MainLayout>
  );
};

export default App;
