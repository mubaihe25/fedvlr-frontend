import React, {useState} from 'react';
import {MainLayout} from './layouts/MainLayout';
import {mockConfigurationData} from './mock/configuration';
import {Architecture} from './pages/Architecture';
import {Home} from './pages/Home';
import {Console} from './pages/console/Console';
import {startTrain, type StartTrainResponse} from './services/train';
import type {ConsoleSessionState, PageType} from './types/common';
import type {TrainConfig} from './types/train';

const cloneConfig = (config: TrainConfig) => structuredClone(config);

const createInitialSession = (): ConsoleSessionState => ({
  activeTaskId: null,
  draftTrainConfig: cloneConfig(mockConfigurationData.defaultConfig),
  comparisonSelectionIds: [],
  analysisTaskId: null,
});

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [consoleSession, setConsoleSession] = useState<ConsoleSessionState>(createInitialSession);

  const handleDraftConfigChange = (config: TrainConfig) => {
    setConsoleSession((prev) => ({
      ...prev,
      draftTrainConfig: cloneConfig(config),
    }));
  };

  const handleStartTrain = async (config: TrainConfig): Promise<StartTrainResponse> => {
    const response = await startTrain(config);

    setConsoleSession((prev) => ({
      ...prev,
      activeTaskId: response.taskId,
      analysisTaskId: response.taskId,
      draftTrainConfig: cloneConfig(config),
    }));
    setCurrentPage('monitoring');

    return response;
  };

  const handleOpenAnalysis = (taskId: string | null) => {
    setConsoleSession((prev) => ({
      ...prev,
      analysisTaskId: taskId,
    }));
    setCurrentPage('analysis');
  };

  const handleAddComparisonSelection = (taskId: string) => {
    setConsoleSession((prev) => ({
      ...prev,
      comparisonSelectionIds: Array.from(new Set([...prev.comparisonSelectionIds, taskId])).slice(-3),
    }));
    setCurrentPage('comparison');
  };

  const handleReuseConfig = (config: TrainConfig, taskId: string | null) => {
    setConsoleSession((prev) => ({
      ...prev,
      draftTrainConfig: cloneConfig(config),
      analysisTaskId: taskId,
    }));
    setCurrentPage('console');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onPageChange={setCurrentPage} />;
      case 'architecture':
        return <Architecture />;
      case 'console':
      case 'monitoring':
      case 'analysis':
      case 'comparison':
      case 'history':
        return (
          <Console
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            session={consoleSession}
            onDraftConfigChange={handleDraftConfigChange}
            onStartTrain={handleStartTrain}
            onOpenAnalysis={handleOpenAnalysis}
            onAddComparisonSelection={handleAddComparisonSelection}
            onReuseConfig={handleReuseConfig}
          />
        );
      default:
        return <Home onPageChange={setCurrentPage} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'home':
        return '联邦推荐安全实验平台 - 首页';
      case 'architecture':
        return '系统架构';
      case 'console':
        return '训练控制台';
      case 'monitoring':
        return '运行监控';
      case 'analysis':
        return '结果分析';
      case 'comparison':
        return '对比分析';
      case 'history':
        return '历史实验';
      default:
        return '联邦推荐安全实验平台';
    }
  };

  return (
    <MainLayout currentPage={currentPage} onPageChange={setCurrentPage} title={getPageTitle()}>
      {renderPage()}
    </MainLayout>
  );
};

export default App;
