import type {TaskLifecycleStatus, TaskLogItem, TaskStatusResponse} from '../types/task';
import type {TrainConfig} from '../types/train';
import {buildTrainConfigSummary, defaultTrainConfig, formatModeLabel} from './configuration';

const createLogs = (taskId: string, status: TaskLifecycleStatus): TaskLogItem[] => {
  const baseLogs: TaskLogItem[] = [
    {
      id: `${taskId}-log-1`,
      timestamp: '2026-03-25 14:22:01',
      level: 'info',
      message: '初始化联邦调度器，准备建立客户端连接。',
    },
    {
      id: `${taskId}-log-2`,
      timestamp: '2026-03-25 14:22:05',
      level: 'success',
      message: '节点同步完成，100 个客户端握手成功。',
    },
    {
      id: `${taskId}-log-3`,
      timestamp: '2026-03-25 14:22:10',
      level: 'info',
      message: '启动全局模型聚合与安全校验流程。',
    },
  ];

  if (status === 'stopped') {
    return [
      ...baseLogs,
      {
        id: `${taskId}-log-4`,
        timestamp: '2026-03-25 14:30:12',
        level: 'warning',
        message: '任务收到停止指令，已安全终止当前轮次。',
      },
    ];
  }

  if (status === 'failed') {
    return [
      ...baseLogs,
      {
        id: `${taskId}-log-4`,
        timestamp: '2026-03-25 14:28:40',
        level: 'error',
        message: '聚合阶段发生异常，部分节点返回恶意梯度，任务执行失败。',
      },
    ];
  }

  if (status === 'completed') {
    return [
      ...baseLogs,
      {
        id: `${taskId}-log-4`,
        timestamp: '2026-03-25 14:45:08',
        level: 'success',
        message: '全部轮次执行完成，结果已写入分析与历史实验模块。',
      },
    ];
  }

  return [
    ...baseLogs,
    {
      id: `${taskId}-log-4`,
      timestamp: '2026-03-25 14:26:30',
      level: 'info',
      message: '进入第 72 轮训练，学习率已衰减至 0.00012。',
    },
  ];
};

export const createTaskStatusSnapshot = (
  taskId: string,
  config: TrainConfig = defaultTrainConfig,
  overrides: Partial<TaskStatusResponse> = {},
): TaskStatusResponse => {
  const status = overrides.status ?? 'running';
  const currentRound = overrides.currentRound ?? (status === 'completed' ? config.totalRounds : 72);
  const progressPercent =
    overrides.progressPercent ?? Math.min(100, Math.round((currentRound / config.totalRounds) * 100));
  const currentGroupName =
    config.mode === 'comparison' ? overrides.currentGroupName ?? 'Attack + Defense' : null;
  const totalGroups = config.mode === 'comparison' ? overrides.totalGroups ?? 3 : null;
  const currentGroupIndex = config.mode === 'comparison' ? overrides.currentGroupIndex ?? 3 : null;
  const summary = buildTrainConfigSummary(config);
  const statusLabel =
    status === 'running'
      ? '训练进行中'
      : status === 'completed'
        ? '训练已完成'
        : status === 'stopped'
          ? '任务已停止'
          : status === 'failed'
            ? '任务失败'
            : '等待执行';

  return {
    taskId,
    status,
    currentRound,
    totalRounds: config.totalRounds,
    elapsedTime:
      overrides.elapsedTime ??
      (status === 'completed' ? '02:44:12' : status === 'stopped' ? '01:26:32' : '01:52:18'),
    currentStage:
      overrides.currentStage ??
      (status === 'completed'
        ? 'completed'
        : status === 'stopped'
          ? 'stopped'
          : status === 'failed'
            ? 'failed'
            : 'training'),
    currentGroupIndex,
    totalGroups,
    currentGroupName,
    progressPercent,
    logs: overrides.logs ?? createLogs(taskId, status),
    statusLabel,
    statusMessage:
      overrides.statusMessage ??
      `${formatModeLabel(config.mode)}正在执行，当前进度 ${progressPercent}% ，可用于监控页演示与后续接口替换。`,
    overviewItems:
      overrides.overviewItems ??
      [
        {label: '任务 ID', value: taskId, mono: true, tone: 'primary'},
        {label: '算法模型', value: summary.modelLabel},
        {label: '当前数据集', value: summary.datasetLabel},
        {
          label: '活跃节点',
          value: `${Math.max(1, Math.round(config.clientCount * config.clientSamplingRate))} / ${config.clientCount}`,
          tone: 'tertiary',
        },
      ],
    metricBars:
      overrides.metricBars ??
      [
        {label: '验证准确率', displayValue: '94.2%', value: 94.2, percent: 94, tone: 'tertiary'},
        {label: '当前学习率', displayValue: '0.00012', value: 0.00012, percent: 42, tone: 'primary'},
        {label: '预计剩余时间', displayValue: '00:44:12', value: 44, percent: 75, tone: 'neutral'},
      ],
    lossCurve:
      overrides.lossCurve ??
      [
        {epoch: 0, loss: 0.9},
        {epoch: 20, loss: 0.7},
        {epoch: 40, loss: 0.42},
        {epoch: 60, loss: 0.25},
        {epoch: 80, loss: 0.16},
        {epoch: 100, loss: 0.12},
      ],
    metricChart:
      overrides.metricChart ??
      [
        {name: 'F1-Score', value: 85},
        {name: 'Precision', value: 92},
        {name: 'Recall', value: 78},
        {name: 'MAP', value: 88},
      ],
    configSummary: overrides.configSummary ?? summary,
  };
};

export const mockMonitoringData = {
  emptyState: {
    title: '暂无运行中的实验任务',
    description: '请先在实验配置页发起训练任务，再回到这里查看实时监控信息。',
  },
  seededTasks: {
    'task-running-demo': createTaskStatusSnapshot('task-running-demo', defaultTrainConfig),
    'task-completed-demo': createTaskStatusSnapshot('task-completed-demo', defaultTrainConfig, {
      status: 'completed',
      progressPercent: 100,
      currentRound: defaultTrainConfig.totalRounds,
    }),
    'task-failed-demo': createTaskStatusSnapshot('task-failed-demo', defaultTrainConfig, {
      status: 'failed',
      currentRound: 48,
      progressPercent: 40,
    }),
  },
};
