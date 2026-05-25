import React, {useCallback, useEffect, useState} from 'react';
import {MainLayout} from './layouts/MainLayout';
import {mockConfigurationData} from './mock/configuration';
import {Architecture} from './pages/Architecture';
import {AttackDefenseRange} from './pages/AttackDefenseRange';
import {ClientPersonalization} from './pages/ClientPersonalization';
import {DataFusion} from './pages/DataFusion';
import {DeliveryReport} from './pages/DeliveryReport';
import {ExperimentResults, type ExperimentResultsView} from './pages/ExperimentResults';
import {Home} from './pages/Home';
import {Console} from './pages/console/Console';
import type {ExperimentConfigurationSource} from './services/experiment';
import {startTrain, type StartTrainResponse} from './services/train';
import type {ConsoleExperimentContext, ConsoleSessionState, PageType} from './types/common';
import type {LaunchExperimentOptions, LaunchExperimentRecord, LaunchExperimentResponse, TrainConfig} from './types/train';

const cloneConfig = (config: TrainConfig) => structuredClone(config);
const CONSOLE_SESSION_STORAGE_KEY = 'fedvlr.console.session.v1';
const RESTORABLE_PAGES: PageType[] = [
  'home',
  'architecture',
  'dataFusion',
  'clientPersonalization',
  'attackDefenseRange',
  'experimentResults',
  'deliveryReport',
  'console',
  'monitoring',
  'analysis',
  'comparison',
  'history',
];

const getExperimentResultsView = (page: PageType): ExperimentResultsView => {
  switch (page) {
    case 'history':
      return 'history';
    case 'comparison':
      return 'comparison';
    case 'analysis':
    case 'experimentResults':
    default:
      return 'analysis';
  }
};

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
  launchId: response.launchResult?.launch_id ?? response.launchResult?.experiment_id ?? response.taskId,
  dataSourceLabel: isValidationLaunch(response) ? '最近一次配置校验' : '最近一次真实启动',
  analysisLockedToHistory: false,
  monitoringLockedToRecentLaunch: true,
  updatedAt: new Date().toISOString(),
});

const isValidationLaunchRecord = (record: LaunchExperimentRecord) =>
  Boolean(
    record.options.validateOnly ||
      record.options.dryRun ||
      record.response.launch_mode === 'validate_only' ||
      record.response.launch_mode === 'dry_run',
  );

const createLaunchContextFromRecord = (record: LaunchExperimentRecord): ConsoleExperimentContext => ({
  source: isValidationLaunchRecord(record) ? 'validate_only' : 'recent_launch',
  taskId: record.taskId,
  experimentKey: null,
  launchId: record.response.launch_id ?? record.response.experiment_id ?? record.taskId,
  dataSourceLabel: isValidationLaunchRecord(record) ? '最近一次配置校验' : '最近一次真实启动',
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isPageType = (value: unknown): value is PageType =>
  typeof value === 'string' && RESTORABLE_PAGES.includes(value as PageType);

const normalizeRestoredSession = (value: unknown): ConsoleSessionState | null => {
  if (!isRecord(value)) {
    return null;
  }

  const fallback = createInitialSession();
  const lastLaunchRecord = isRecord(value.lastLaunchRecord)
    ? (value.lastLaunchRecord as unknown as LaunchExperimentRecord)
    : null;
  const restoredContext = isRecord(value.currentExperimentContext)
    ? (value.currentExperimentContext as unknown as ConsoleExperimentContext)
    : null;
  const currentExperimentContext = lastLaunchRecord && (!restoredContext || restoredContext.source === 'mock')
    ? createLaunchContextFromRecord(lastLaunchRecord)
    : restoredContext ?? fallback.currentExperimentContext;
  const activeTaskId =
    typeof value.activeTaskId === 'string'
      ? value.activeTaskId
      : lastLaunchRecord?.response.launch_id ?? lastLaunchRecord?.taskId ?? fallback.activeTaskId;

  return {
    activeTaskId,
    draftTrainConfig: isRecord(value.draftTrainConfig)
      ? (value.draftTrainConfig as unknown as TrainConfig)
      : fallback.draftTrainConfig,
    comparisonSelectionIds: Array.isArray(value.comparisonSelectionIds)
      ? value.comparisonSelectionIds.filter((item): item is string => typeof item === 'string')
      : fallback.comparisonSelectionIds,
    analysisTaskId: typeof value.analysisTaskId === 'string' ? value.analysisTaskId : fallback.analysisTaskId,
    lastLaunchRecord,
    currentExperimentContext,
  };
};

const restoreConsoleState = (): {currentPage: PageType; consoleSession: ConsoleSessionState} => {
  const fallback = {
    currentPage: 'home' as PageType,
    consoleSession: createInitialSession(),
  };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawValue = window.sessionStorage.getItem(CONSOLE_SESSION_STORAGE_KEY);
    if (!rawValue) {
      return fallback;
    }

    const parsed = JSON.parse(rawValue) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1) {
      return fallback;
    }

    const restoredSession = normalizeRestoredSession(parsed.consoleSession);
    if (!restoredSession) {
      return fallback;
    }

    return {
      currentPage: isPageType(parsed.currentPage) ? parsed.currentPage : fallback.currentPage,
      consoleSession: restoredSession,
    };
  } catch {
    return fallback;
  }
};

const getPageTitle = (currentPage: PageType) => {
  switch (currentPage) {
    case 'home':
      return '系统总览';
    case 'attackDefenseRange':
      return '攻防沙盘';
    case 'experimentResults':
      return '实验结果';
    case 'deliveryReport':
      return '交付报告';
    case 'architecture':
      return '系统架构';
    case 'dataFusion':
      return '数据与融合';
    case 'clientPersonalization':
      return '客户端个性化';
    case 'console':
      return '开发者控制台';
    case 'monitoring':
      return '开发者控制台 - 运行监控';
    case 'analysis':
      return '开发者控制台 - 单次分析';
    case 'comparison':
      return '开发者控制台 - 横向对比';
    case 'history':
      return '开发者控制台 - 历史实验';
    default:
      return '联邦推荐攻防沙盘';
  }
};

const App: React.FC = () => {
  const [initialState] = useState(restoreConsoleState);
  const [currentPage, setCurrentPage] = useState<PageType>(initialState.currentPage);
  const [consoleSession, setConsoleSession] = useState<ConsoleSessionState>(initialState.consoleSession);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.setItem(
        CONSOLE_SESSION_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          currentPage,
          consoleSession,
        }),
      );
    } catch {
      // sessionStorage is a convenience cache; failures should not affect the app.
    }
  }, [currentPage, consoleSession]);

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

  const handleLaunchStatusChange = useCallback((status: LaunchExperimentResponse) => {
    setConsoleSession((prev) => {
      if (!prev.lastLaunchRecord) {
        return prev;
      }

      const currentLaunchId = prev.lastLaunchRecord.response.launch_id ?? prev.lastLaunchRecord.taskId;
      const nextLaunchId = status.launch_id ?? status.experiment_id ?? prev.lastLaunchRecord.taskId;
      if (currentLaunchId !== nextLaunchId) {
        return prev;
      }

      return {
        ...prev,
        activeTaskId: status.launch_id ?? prev.activeTaskId,
        analysisTaskId: prev.analysisTaskId === prev.lastLaunchRecord.taskId ? (status.launch_id ?? prev.analysisTaskId) : prev.analysisTaskId,
        lastLaunchRecord: {
          ...prev.lastLaunchRecord,
          taskId: status.launch_id ?? prev.lastLaunchRecord.taskId,
          response: status,
        },
        currentExperimentContext:
          prev.currentExperimentContext.source === 'recent_launch' || prev.currentExperimentContext.source === 'validate_only'
            ? {
                ...prev.currentExperimentContext,
                taskId: status.launch_id ?? prev.currentExperimentContext.taskId,
                launchId: status.launch_id ?? status.experiment_id ?? prev.currentExperimentContext.launchId,
                updatedAt: new Date().toISOString(),
              }
            : prev.currentExperimentContext,
      };
    });
  }, []);

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
      comparisonSelectionIds: prev.comparisonSelectionIds.includes(taskId)
        ? prev.comparisonSelectionIds.filter((id) => id !== taskId)
        : prev.comparisonSelectionIds.length >= 3
          ? prev.comparisonSelectionIds
          : [...prev.comparisonSelectionIds, taskId],
    }));
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
      case 'dataFusion':
        return <DataFusion />;
      case 'clientPersonalization':
        return <ClientPersonalization />;
      case 'attackDefenseRange':
        return <AttackDefenseRange />;
      case 'deliveryReport':
        return <DeliveryReport />;
      case 'console':
      case 'monitoring':
        return (
          <Console
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            session={consoleSession}
            onDraftConfigChange={handleDraftConfigChange}
            onStartTrain={handleStartTrain}
            onLaunchStatusChange={handleLaunchStatusChange}
            onOpenAnalysis={handleOpenAnalysis}
            onAddComparisonSelection={handleAddComparisonSelection}
            onOpenComparison={() => setCurrentPage('comparison')}
            onReuseConfig={handleReuseConfig}
          />
        );
      case 'experimentResults':
      case 'analysis':
      case 'comparison':
      case 'history':
        return (
          <ExperimentResults
            initialView={getExperimentResultsView(currentPage)}
            session={consoleSession}
            onOpenAnalysis={handleOpenAnalysis}
            onAddComparisonSelection={handleAddComparisonSelection}
            onOpenComparison={() => setCurrentPage('comparison')}
            onReuseConfig={handleReuseConfig}
          />
        );
      default:
        return <Home onPageChange={setCurrentPage} />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onPageChange={setCurrentPage} title={getPageTitle(currentPage)}>
      {renderPage()}
    </MainLayout>
  );
};

export default App;
