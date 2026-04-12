import React, {useEffect, useState} from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  FolderOpen,
  Info,
  StopCircle,
  Terminal as TerminalIcon,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {getTaskStatus, stopTask} from '../../services/task';
import {getLaunchStatus} from '../../services/experiment';
import {cn} from '../../lib/utils';
import type {AsyncState, ConsoleExperimentContext} from '../../types/common';
import type {TaskLogLevel, TaskStatusResponse} from '../../types/task';
import type {LaunchExperimentRecord, LaunchExperimentResponse} from '../../types/train';

interface MonitoringProps {
  activeTaskId: string | null;
  lastLaunchRecord: LaunchExperimentRecord | null;
  experimentContext: ConsoleExperimentContext;
  onOpenAnalysis: (taskId: string | null) => void;
  onLaunchStatusChange: (status: LaunchExperimentResponse) => void;
}

const statusToneClasses = {
  idle: 'border-outline-variant/20 bg-surface-container-highest text-on-surface-variant',
  queued: 'border-primary/20 bg-primary/10 text-primary',
  running: 'border-tertiary/20 bg-tertiary/10 text-tertiary',
  completed: 'border-primary/20 bg-primary/10 text-primary',
  stopped: 'border-error/20 bg-error/10 text-error',
  failed: 'border-error/20 bg-error/10 text-error',
} as const;

const barToneClasses = {
  primary: 'bg-primary text-primary',
  tertiary: 'bg-tertiary text-tertiary',
  neutral: 'bg-on-surface text-on-surface',
  secondary: 'bg-secondary text-secondary',
  info: 'bg-primary text-primary',
  success: 'bg-tertiary text-tertiary',
  warning: 'bg-error text-error',
  danger: 'bg-error text-error',
} as const;

const logToneClasses: Record<TaskLogLevel, string> = {
  info: 'text-primary',
  success: 'text-tertiary',
  warning: 'text-error',
  error: 'text-error',
};

const formatSubmittedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

const isValidationLaunch = (record: LaunchExperimentRecord) =>
  Boolean(
    record.options.validateOnly ||
      record.options.dryRun ||
      record.response.launch_mode === 'validate_only' ||
      record.response.launch_mode === 'dry_run',
  );

export const Monitoring: React.FC<MonitoringProps> = ({
  activeTaskId,
  lastLaunchRecord,
  experimentContext,
  onOpenAnalysis,
  onLaunchStatusChange,
}) => {
  const [loadState, setLoadState] = useState<AsyncState>('idle');
  const [task, setTask] = useState<TaskStatusResponse | null>(null);
  const [launchStatus, setLaunchStatus] = useState<LaunchExperimentResponse | null>(null);
  const [launchPollState, setLaunchPollState] = useState<AsyncState>('idle');
  const [launchPollError, setLaunchPollError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    const launchId = lastLaunchRecord?.response.launch_id ?? experimentContext.launchId;
    if (!lastLaunchRecord || !launchId) {
      setLaunchStatus(null);
      setLaunchPollState('idle');
      setLaunchPollError('');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const terminalStatuses = new Set(['completed', 'failed', 'stopped']);

    const pollLaunchStatus = async () => {
      try {
        setLaunchPollState((current) => (current === 'success' ? current : 'loading'));
        const nextStatus = await getLaunchStatus(launchId);
        if (cancelled) {
          return;
        }

        setLaunchStatus(nextStatus);
        onLaunchStatusChange(nextStatus);
        setLaunchPollState('success');
        setLaunchPollError('');
        const status = nextStatus.status ?? '';
        const shouldStopPolling =
          terminalStatuses.has(status) ||
          ((nextStatus.launch_mode === 'validate_only' || nextStatus.launch_mode === 'dry_run') && status === 'completed');
        if (!shouldStopPolling) {
          timer = setTimeout(pollLaunchStatus, 2500);
        }
      } catch (error) {
        if (!cancelled) {
          setLaunchPollState('error');
          setLaunchPollError(error instanceof Error ? error.message : '启动状态轮询失败');
          timer = setTimeout(pollLaunchStatus, 4000);
        }
      }
    };

    void pollLaunchStatus();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [experimentContext.launchId, lastLaunchRecord?.response.launch_id, lastLaunchRecord?.taskId, onLaunchStatusChange]);

  useEffect(() => {
    let cancelled = false;

    if (lastLaunchRecord) {
      setTask(null);
      setErrorMessage('');
      setLoadState('success');
      return () => {
        cancelled = true;
      };
    }

    if (!activeTaskId) {
      setTask(null);
      setLoadState('empty');
      return () => {
        cancelled = true;
      };
    }

    const loadTask = async () => {
      try {
        setLoadState('loading');
        setErrorMessage('');
        const nextTask = await getTaskStatus(activeTaskId);
        if (!cancelled) {
          setTask(nextTask);
          setLoadState('success');
        }
      } catch (error) {
        if (!cancelled) {
          setTask(null);
          setLoadState('error');
          setErrorMessage(error instanceof Error ? error.message : '监控数据加载失败。');
        }
      }
    };

    loadTask();

    return () => {
      cancelled = true;
    };
  }, [activeTaskId, lastLaunchRecord]);

  const handleStop = async () => {
    if (!activeTaskId) {
      return;
    }

    try {
      setIsStopping(true);
      await stopTask(activeTaskId);
      const nextTask = await getTaskStatus(activeTaskId);
      setTask(nextTask);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '停止任务失败。');
    } finally {
      setIsStopping(false);
    }
  };

  if (lastLaunchRecord) {
    const response = launchStatus ?? lastLaunchRecord.response;
    const validationOnly =
      isValidationLaunch(lastLaunchRecord) ||
      response.launch_mode === 'validate_only' ||
      response.launch_mode === 'dry_run';
    const warnings = response.validation_warnings ?? [];
    const errors = response.errors ?? [];
    const stdoutTail = response.stdout_tail?.trim();
    const stderrTail = response.stderr_tail?.trim();
    const isRunning = response.status === 'running' || response.status === 'queued';
    const isFailed = response.status === 'failed' || (!response.success && !isRunning);
    const statusTone = isRunning
      ? 'border-primary/20 bg-primary/10 text-primary'
      : isFailed
        ? 'border-error/20 bg-error/10 text-error'
        : 'border-tertiary/20 bg-tertiary/10 text-tertiary';
    const StatusIcon = isRunning ? TerminalIcon : isFailed ? XCircle : CheckCircle2;
    const launchId = response.launch_id ?? lastLaunchRecord.response.launch_id ?? lastLaunchRecord.taskId;
    const canOpenAnalysis = !validationOnly && response.status === 'completed' && Boolean(response.experiment_id || response.summary_path || response.result_path);
    const overviewItems = [
      {label: 'Launch ID', value: launchId, mono: true},
      {label: '当前状态', value: validationOnly ? '仅校验' : response.status ?? '未知'},
      {label: '进程 PID', value: response.pid ? String(response.pid) : '未返回', mono: true},
      {label: '接口接收', value: response.accepted ? '已接收' : '未接收'},
      {label: '执行结果', value: response.success ? '成功' : '失败'},
      {label: '提交模式', value: validationOnly ? '仅校验' : '已启动训练'},
      {label: '后端模式', value: response.launch_mode || '未返回'},
      {label: '实验 ID', value: response.experiment_id ?? lastLaunchRecord.taskId ?? '未返回', mono: true},
      {label: '提交时间', value: response.submitted_at ? formatSubmittedAt(response.submitted_at) : formatSubmittedAt(lastLaunchRecord.submittedAt)},
      {label: '开始时间', value: response.started_at ? formatSubmittedAt(response.started_at) : '未开始'},
      {label: '完成时间', value: response.finished_at ? formatSubmittedAt(response.finished_at) : '未完成'},
    ];
    const pathItems = [
      {label: '结果目录', value: response.result_dir},
      {label: '摘要文件', value: response.summary_path},
      {label: '详细结果', value: response.result_path},
      {label: 'CSV 文件', value: response.csv_path},
    ].filter((item) => item.value);

    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-on-background">运行监控中心</h2>
              <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1', statusTone)}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">{validationOnly ? '配置校验结果' : '真实启动结果'}</span>
              </div>
            </div>
            <p className="max-w-3xl text-sm text-on-surface-variant">
              {validationOnly
                ? '当前为配置校验结果，未启动训练。'
                : '已提交后端 launcher。当前 API 尚未提供实时任务轮询，本页展示启动返回、输出路径与基础日志摘要。'}
            </p>
          </div>
          <button
            onClick={() => onOpenAnalysis(lastLaunchRecord.taskId)}
            disabled={!validationOnly && !canOpenAnalysis}
            title={!validationOnly && !canOpenAnalysis ? '结果尚未生成，训练完成后可进入分析页' : undefined}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-surface shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BarChart3 className="h-4 w-4" />
            {validationOnly ? '查看校验说明' : canOpenAnalysis ? '查看单次分析' : '结果尚未生成'}
          </button>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-primary">
          当前展示的是{experimentContext.dataSourceLabel}；页面会基于 Launch ID 轮询真实启动状态、日志摘要和结果路径。
          {launchPollState === 'loading' ? ' 正在刷新状态...' : null}
          {launchPollState === 'error' ? ` 状态轮询暂时失败：${launchPollError}，保留最近一次成功快照。` : null}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-xl lg:col-span-5">
            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold">
              <Info className="h-4 w-4 text-primary" />
              最近一次提交概览
            </h3>
            <div className="space-y-3">
              {overviewItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-6 border-b border-outline-variant/10 py-2">
                  <span className="text-sm text-on-surface-variant">{item.label}</span>
                  <span className={cn('text-right text-sm font-semibold text-on-surface', item.mono && 'font-mono')}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            {lastLaunchRecord.message ? (
              <div className="mt-6 rounded-lg bg-surface-container-highest px-4 py-3 text-xs text-on-surface-variant">
                {lastLaunchRecord.message}
              </div>
            ) : null}
          </div>

          <div className="col-span-12 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-xl lg:col-span-7">
            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold">
              <FolderOpen className="h-4 w-4 text-tertiary" />
              结果文件路径
            </h3>
            {pathItems.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {pathItems.map((item) => (
                  <div key={item.label} className="rounded-lg bg-surface-container-highest p-4">
                    <p className="mb-2 text-xs font-bold text-on-surface-variant">{item.label}</p>
                    <p className="break-all font-mono text-xs leading-relaxed text-on-surface">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-container-highest p-4 text-sm text-on-surface-variant">
                后端本次未返回结果文件路径。若这是仅校验模式，这是预期表现。
              </div>
            )}
          </div>

          <div className="col-span-12 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-xl lg:col-span-6">
            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 text-error" />
              Warnings / Errors 摘要
            </h3>
            <div className="space-y-3">
              {warnings.length ? (
                warnings.map((warning) => (
                  <div key={warning} className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-xs text-primary">
                    {warning}
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-surface-container-highest px-4 py-3 text-xs text-on-surface-variant">
                  暂无校验警告。
                </div>
              )}
              {errors.length ? (
                errors.map((error) => (
                  <div key={error} className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs text-error">
                    {error}
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-surface-container-highest px-4 py-3 text-xs text-on-surface-variant">
                  暂无错误信息。
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-xl lg:col-span-6">
            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold">
              <FileText className="h-4 w-4 text-primary" />
              提交配置摘要
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-surface-container-highest p-4">
                <p className="text-xs text-on-surface-variant">模型</p>
                <p className="mt-1 font-semibold text-on-surface">{lastLaunchRecord.config.model}</p>
              </div>
              <div className="rounded-lg bg-surface-container-highest p-4">
                <p className="text-xs text-on-surface-variant">数据集</p>
                <p className="mt-1 font-semibold text-on-surface">{lastLaunchRecord.config.dataset}</p>
              </div>
              <div className="rounded-lg bg-surface-container-highest p-4">
                <p className="text-xs text-on-surface-variant">训练轮数</p>
                <p className="mt-1 font-mono font-semibold text-primary">{lastLaunchRecord.config.totalRounds}</p>
              </div>
              <div className="rounded-lg bg-surface-container-highest p-4">
                <p className="text-xs text-on-surface-variant">客户端采样率</p>
                <p className="mt-1 font-mono font-semibold text-primary">
                  {Math.round(lastLaunchRecord.config.clientSamplingRate * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-12 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-highest px-6 py-4">
              <div className="flex items-center gap-3">
                <TerminalIcon className="h-4 w-4 text-on-surface-variant" />
                <h3 className="text-sm font-bold">Launcher 输出摘要</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                stdout / stderr tail
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 bg-black/60 p-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold text-primary">stdout_tail</p>
                <pre className="min-h-44 whitespace-pre-wrap break-words rounded-lg bg-black/50 p-4 font-mono text-xs leading-relaxed text-on-surface-variant">
                  {stdoutTail || '暂无 stdout 输出摘要。'}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-error">stderr_tail</p>
                <pre className="min-h-44 whitespace-pre-wrap break-words rounded-lg bg-black/50 p-4 font-mono text-xs leading-relaxed text-on-surface-variant">
                  {stderrTail || '暂无 stderr 输出摘要。'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadState === 'empty') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center">
        <h2 className="text-2xl font-bold text-on-surface">暂无运行中的实验任务</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          当前暂无真实启动记录。请先在“实验配置”页提交实验；若真实接口不可用，页面会回退到 mock 监控示例。
        </p>
      </div>
    );
  }

  if (loadState === 'loading') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center text-on-surface-variant">
        正在加载任务监控数据...
      </div>
    );
  }

  if (loadState === 'error' || !task) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/10 p-10 text-center">
        <h2 className="text-2xl font-bold text-error">监控数据加载失败</h2>
        <p className="mt-3 text-sm text-on-surface-variant">{errorMessage || '请稍后重试。'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-on-background">运行监控中心</h2>
            <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1', statusToneClasses[task.status])}>
              <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
              <span className="text-xs font-bold">{task.statusLabel}</span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">{task.statusMessage}</p>
          {task.currentGroupName ? (
            <p className="text-xs text-primary">
              当前组别：{task.currentGroupName}（{task.currentGroupIndex}/{task.totalGroups}）
            </p>
          ) : null}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onOpenAnalysis(task.taskId)}
            className="flex items-center gap-2 rounded bg-surface-container-highest px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-high"
          >
            <BarChart3 className="h-4 w-4" />
            结果详情
          </button>
          <button
            onClick={handleStop}
            disabled={isStopping || task.status !== 'running'}
            className="flex items-center gap-2 rounded bg-error/20 px-5 py-2.5 text-sm font-semibold text-error transition-all hover:bg-error/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <StopCircle className="h-4 w-4" />
            {isStopping ? '正在停止...' : '终止任务'}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{errorMessage}</div>
      ) : null}

      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
        当前暂无真实启动记录，以下内容来自 mock 任务快照，仅作为运行监控页示例展示。
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-xl lg:col-span-4">
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <Info className="h-4 w-4" />
              任务概览
            </h3>
            <div className="space-y-4">
              {task.overviewItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-outline-variant/10 py-2">
                  <span className="text-sm text-on-surface-variant">{item.label}</span>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      item.mono && 'font-mono',
                      item.tone === 'primary' && 'text-primary',
                      item.tone === 'tertiary' && 'text-tertiary',
                      !item.tone && 'text-on-surface',
                    )}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 border-t border-outline-variant/10 pt-6">
            <div className="flex items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  style={{width: `${task.progressPercent}%`}}
                />
              </div>
              <span className="text-xl font-bold text-primary">{task.progressPercent}%</span>
            </div>
            <p className="mt-2 text-[10px] font-medium tracking-wide text-on-surface-variant">TOTAL TRAINING COMPLETION</p>
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-8 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-xl md:grid-cols-2 lg:col-span-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90 transform">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container-highest" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={440}
                  strokeDashoffset={440 * (1 - task.currentRound / task.totalRounds)}
                  className="text-primary drop-shadow-[0_0_8px_rgba(129,236,255,0.4)] transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-on-surface">{task.currentRound}</span>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Rounds</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">当前轮次</p>
              <p className="text-xs text-on-surface-variant">目标：{task.totalRounds} 轮</p>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-6">
            {task.metricBars.map((stat) => {
              const toneClass = barToneClasses[stat.tone] ?? barToneClasses.neutral;

              return (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                    <span>{stat.label}</span>
                    <span className={toneClass.split(' ')[1]}>{stat.displayValue}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                    <div className={toneClass.split(' ')[0]} style={{width: `${stat.percent}%`, height: '100%'}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-xl lg:col-span-6">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <TrendingUp className="h-4 w-4 text-primary" />
              实时收敛曲线
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={task.lossCurve}>
                <defs>
                  <linearGradient id="monitoringLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#81ecff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#81ecff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1d2730" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="epoch" stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px'}} />
                <Area type="monotone" dataKey="loss" stroke="#81ecff" strokeWidth={3} fillOpacity={1} fill="url(#monitoringLoss)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-xl lg:col-span-6">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <BarChart3 className="h-4 w-4 text-tertiary" />
              指标表现对比
            </h3>
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Real-time sampling</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={task.metricChart}>
                <CartesianGrid stroke="#1d2730" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px'}} cursor={{fill: '#1d2730'}} />
                <Bar dataKey="value" fill="#afffd1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-2xl">
          <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-highest px-6 py-4">
            <div className="flex items-center gap-3">
              <TerminalIcon className="h-4 w-4 text-on-surface-variant" />
              <h3 className="text-sm font-bold">实时运行日志</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 font-mono text-[10px] text-on-surface-variant">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                STREAMING ACTIVE
              </span>
              <button className="text-on-surface-variant transition-colors hover:text-on-surface">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="no-scrollbar h-80 space-y-2 overflow-y-auto bg-black/60 p-6 font-mono text-xs leading-relaxed">
            {task.logs.map((log) => (
              <p key={log.id} className="text-on-surface-variant">
                [{log.timestamp}] <span className={logToneClasses[log.level]}>{log.level.toUpperCase()}</span> {log.message}
              </p>
            ))}
            <p className="animate-pulse text-primary">_</p>
          </div>
        </div>
      </div>
    </div>
  );
};
