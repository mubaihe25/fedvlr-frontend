import React, {useState} from 'react';
import {MainLayout} from './layouts/MainLayout';
import {mockConfigurationData} from './mock/configuration';
import {Architecture} from './pages/Architecture';
import {Home} from './pages/Home';
import {Console} from './pages/console/Console';
import type {ExperimentConfigurationSource} from './services/experiment';
import {startTrain, type StartTrainResponse} from './services/train';
import type {ConsoleExperimentContext, ConsoleSessionState, PageType} from './types/common';
import type {LaunchExperimentOptions, TrainConfig} from './types/train';

const cloneConfig = (config: TrainConfig) => structuredClone(config);

const createMockContext = (): ConsoleExperimentContext => ({
  source: 'mock',
  taskId: null,
  experimentKey: null,
  launchId: null,
  dataSourceLabel: 'Mock 示例上下文',
  analysisLockedToHistory: false,
  monitoringLockedToRecentLaunch: false,
  updatedAt: new Date().toISOString(),
});

const createInitialSession = (): ConsoleSessionState => ({
  activeTaskId: null,
  draftTrainConfig: cloneConfig(mockConfigurationData.defaultConfig),
  comparisonSelectionIds: [],
  analysisTaskId: null,
  lastLaunchRecord: null,
  currentExperimentContext: createMockContext(),
});

const getExperimentKeyFromTaskId = (taskId: string | null) => (taskId?.startsWith('api::') ? taskId.slice(5) : null);

const isValidationLaunch = (response: StartTrainResponse) =>
  Boolean(response.launchResult?.launch_mode === 'validate_only' || response.launchResult?.launch_mode === 'dry_run');

const createLaunchContext = (response: StartTrainResponse): ConsoleExperimentContext => ({
  source: isValidationLaunch(response) ? 'validate_only' : 'recent_launch',
  taskId: response.taskId,
  experimentKey: null,
  launchId: response.launchResult?.experiment_id ?? response.taskId,
  dataSourceLabel: isValidationLaunch(response) ? '最近一次配置校验' : '最近一次真实启动',
  analysisLockedToHistory: false,
  monitoringLockedToRecentLaunch: true,
  updatedAt: new Date().toISOString(),
});

const createHistoryContext = (taskId: string): ConsoleExperimentContext => ({
  source: 'history_record',
  taskId,
  experimentKey: getExperimentKeyFromTaskId(taskId),
  launchId: null,
  dataSourceLabel: '历史实验真实上下文',
  analysisLockedToHistory: true,
  monitoringLockedToRecentLaunch: false,
  updatedAt: new Date().toISOString(),
});

const createMockTaskContext = (taskId: string | null): ConsoleExperimentContext => ({
  source: 'mock',
  taskId,
  experimentKey: null,
  launchId: taskId,
  dataSourceLabel: 'Mock 示例上下文',
  analysisLockedToHistory: false,
  monitoringLockedToRecentLaunch: false,
  updatedAt: new Date().toISOString(),
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

  const handleStartTrain = async (
    config: TrainConfig,
    options?: LaunchExperimentOptions,
    source?: ExperimentConfigurationSource,
  ): Promise<StartTrainResponse> => {
    const response = await startTrain(config, options, source);
    const launchRecord = response.launchResult
      ? {
          taskId: response.taskId,
          config: cloneConfig(config),
          options: {...(options ?? {})},
          response: response.launchResult,
          submittedAt: new Date().toISOString(),
          dataSource: response.dataSource ?? 'api',
          dataSourceLabel: source?.dataSourceLabel,
          message: response.message,
        }
      : null;

    setConsoleSession((prev) => ({
      ...prev,
      activeTaskId: response.status === 'failed' ? prev.activeTaskId : response.taskId,
      analysisTaskId: response.status === 'failed' ? prev.analysisTaskId : response.taskId,
      draftTrainConfig: cloneConfig(config),
      lastLaunchRecord: launchRecord,
      currentExperimentContext: launchRecord ? createLaunchContext(response) : createMockTaskContext(response.taskId),
    }));
    if (response.status !== 'failed') {
      setCurrentPage('monitoring');
    }

    return response;
  };

  const handleOpenAnalysis = (taskId: string | null) => {
    setConsoleSession((prev) => ({
      ...prev,
      analysisTaskId: taskId,
      currentExperimentContext: taskId?.startsWith('api::')
        ? createHistoryContext(taskId)
        : prev.lastLaunchRecord && taskId === prev.lastLaunchRecord.taskId
          ? createLaunchContext({
              taskId: prev.lastLaunchRecord.taskId,
              status: prev.lastLaunchRecord.response.success ? 'completed' : 'failed',
              message: prev.lastLaunchRecord.message ?? '',
              dataSource: prev.lastLaunchRecord.dataSource,
              launchResult: prev.lastLaunchRecord.response,
            })
          : createMockTaskContext(taskId),
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
      currentExperimentContext: taskId?.startsWith('api::') ? createHistoryContext(taskId) : prev.currentExperimentContext,
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
