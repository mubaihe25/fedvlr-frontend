import React, {useEffect, useMemo, useState} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FilterX,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import {cn} from '../../lib/utils';
import {deleteHistory, getHistoryList, reuseHistoryConfig} from '../../services/history';
import {mockHistoryData} from '../../mock/history';
import type {AsyncState} from '../../types/common';
import type {HistoryFilters, HistoryRecord} from '../../types/history';
import type {TrainConfig} from '../../types/train';

interface HistoryProps {
  comparisonSelectionIds: string[];
  onOpenAnalysis: (taskId: string | null) => void;
  onAddComparisonSelection: (taskId: string) => void;
  onReuseConfig: (config: TrainConfig, taskId: string | null) => void;
}

const initialFilters: HistoryFilters = {
  period: '7d',
  model: 'all',
  mode: 'all',
  keyword: '',
};

const statusClasses = {
  completed: 'border border-tertiary/20 bg-tertiary/10 text-tertiary',
  failed: 'border border-error/20 bg-error/10 text-error',
  stopped: 'border border-error/20 bg-error/10 text-error',
} as const;

export const History: React.FC<HistoryProps> = ({
  comparisonSelectionIds,
  onOpenAnalysis,
  onAddComparisonSelection,
  onReuseConfig,
}) => {
  const [loadState, setLoadState] = useState<AsyncState>('loading');
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>(mockHistoryData.defaultDetailId);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        setLoadState('loading');
        setErrorMessage('');
        const response = await getHistoryList();
        if (!cancelled) {
          setRecords(response.records);
          setSelectedId((current) => current ?? response.records[0]?.id ?? null);
          setLoadState(response.records.length ? 'success' : 'empty');
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState('error');
          setErrorMessage(error instanceof Error ? error.message : '历史实验加载失败。');
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const keyword = filters.keyword.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        [record.name, record.model, record.dataset].some((text) => text.toLowerCase().includes(keyword));
      const matchesModel = filters.model === 'all' || record.model === filters.model;
      const matchesMode = filters.mode === 'all' || record.mode === filters.mode;

      return matchesKeyword && matchesModel && matchesMode;
    });
  }, [records, filters]);

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedId(null);
      return;
    }

    const selectedStillExists = filteredRecords.some((record) => record.id === selectedId);
    if (!selectedStillExists) {
      setSelectedId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedId]);

  const selectedRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? null;
  const completedCount = records.filter((record) => record.status === 'completed').length;
  const successRate = records.length ? `${Math.round((completedCount / records.length) * 100)}%` : '0%';

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleViewDetail = (record: HistoryRecord) => {
    setSelectedId(record.id);
    if (record.status === 'completed') {
      onOpenAnalysis(record.taskId);
    }
  };

  const handleReuse = async (recordId: string) => {
    try {
      setBusyId(recordId);
      const response = await reuseHistoryConfig(recordId);
      onReuseConfig(response.config, response.taskId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '复用配置失败。');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedRecord) {
      return;
    }

    try {
      setBusyId(selectedRecord.id);
      await deleteHistory(selectedRecord.id);
      const nextRecords = records.filter((record) => record.id !== selectedRecord.id);
      setRecords(nextRecords);
      setSelectedId(nextRecords[0]?.id ?? null);
      setLoadState(nextRecords.length ? 'success' : 'empty');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '删除历史实验失败。');
    } finally {
      setBusyId(null);
    }
  };

  if (loadState === 'loading') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center text-on-surface-variant">
        正在加载历史实验记录...
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/10 p-10 text-center">
        <h2 className="text-2xl font-bold text-error">历史实验加载失败</h2>
        <p className="mt-3 text-sm text-on-surface-variant">{errorMessage || '请稍后重试。'}</p>
      </div>
    );
  }

  if (loadState === 'empty') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center">
        <h2 className="text-2xl font-bold text-on-surface">暂无历史实验</h2>
        <p className="mt-3 text-sm text-on-surface-variant">当前会话中还没有可供管理的历史实验记录。</p>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-on-background">历史实验记录</h1>
          <p className="text-sm text-on-surface-variant">追溯、管理并对比所有已执行的联邦学习安全实验任务。</p>
        </div>
        <div className="flex gap-4">
          <div className="rounded-xl border-l-4 border-primary bg-surface-container px-6 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">总实验数</p>
            <p className="text-2xl font-bold text-primary">{records.length}</p>
          </div>
          <div className="rounded-xl border-l-4 border-tertiary bg-surface-container px-6 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">成功率</p>
            <p className="text-2xl font-bold text-tertiary">{successRate}</p>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{errorMessage}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-9">
          <section className="flex flex-wrap items-center gap-4 rounded-xl bg-surface-container-low p-4">
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-highest px-3 py-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <select
                value={filters.period}
                onChange={(event) => setFilters((current) => ({...current, period: event.target.value}))}
                className="cursor-pointer bg-transparent text-xs text-on-surface outline-none"
              >
                {mockHistoryData.filterOptions.periods.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-highest px-3 py-1.5">
              <Cpu className="h-4 w-4 text-primary" />
              <select
                value={filters.model}
                onChange={(event) => setFilters((current) => ({...current, model: event.target.value}))}
                className="cursor-pointer bg-transparent text-xs text-on-surface outline-none"
              >
                {mockHistoryData.filterOptions.models.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-highest px-3 py-1.5">
              <Shield className="h-4 w-4 text-primary" />
              <select
                value={filters.mode}
                onChange={(event) => setFilters((current) => ({...current, mode: event.target.value}))}
                className="cursor-pointer bg-transparent text-xs text-on-surface outline-none"
              >
                {mockHistoryData.filterOptions.modes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto flex min-w-[220px] items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-highest px-3 py-1.5">
              <Search className="h-4 w-4 text-on-surface-variant" />
              <input
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({...current, keyword: event.target.value}))}
                placeholder="搜索实验名称、模型或数据集"
                className="w-full bg-transparent text-xs text-on-surface outline-none"
              />
            </div>
            <button onClick={handleResetFilters} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              <FilterX className="h-4 w-4" />
              重置筛选
            </button>
          </section>

          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const isSelected = record.id === selectedRecord?.id;
              const isCompleted = record.status === 'completed';

              return (
                <div
                  key={record.id}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border bg-surface-container-low p-5 shadow-[0_0_40px_rgba(129,236,255,0.02)] transition-all duration-300',
                    isSelected
                      ? 'border-primary/40 bg-surface-container'
                      : record.status === 'failed'
                        ? 'border-transparent hover:border-error/30 hover:bg-surface-container'
                        : 'border-transparent hover:border-primary/30 hover:bg-surface-container',
                  )}
                >
                  <div className="absolute right-0 top-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setSelectedId(record.id)}
                      className="p-1 text-on-surface-variant transition-colors hover:text-primary"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-highest">
                        {record.status === 'failed' ? (
                          <AlertTriangle className="h-6 w-6 text-error" fill="currentColor" />
                        ) : (
                          <Shield className="h-6 w-6 text-primary" fill="currentColor" />
                        )}
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-3">
                          <h3 className="font-bold text-on-background">{record.name}</h3>
                          <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClasses[record.status])}>
                            {record.status}
                          </span>
                          {comparisonSelectionIds.includes(record.taskId) ? (
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">已加入对比</span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {record.createdAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3.5 w-3.5" /> {record.model}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="h-3.5 w-3.5" /> {record.dataset}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto sm:text-right">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">指标简报</p>
                      {record.status === 'failed' ? (
                        <p className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-error sm:justify-end">
                          <AlertCircle className="h-3.5 w-3.5" /> {record.errorMessage}
                        </p>
                      ) : (
                        <div className="flex gap-3 sm:justify-end">
                          <div className="flex flex-col sm:items-end">
                            <span className="text-xs text-on-surface-variant">
                              {record.metrics.f1Score !== undefined ? 'F1 Score' : 'Accuracy'}
                            </span>
                            <span className="text-lg font-bold text-primary">
                              {record.metrics.f1Score !== undefined
                                ? record.metrics.f1Score.toFixed(3)
                                : `${((record.metrics.accuracy ?? 0) * 100).toFixed(1)}%`}
                            </span>
                          </div>
                          <div className="flex flex-col sm:items-end">
                            <span className="text-xs text-on-surface-variant">
                              {record.metrics.privacyBudget !== undefined ? '隐私预算' : 'Loss'}
                            </span>
                            <span className="text-lg font-bold text-secondary">
                              {record.metrics.privacyBudget !== undefined
                                ? `ε=${record.metrics.privacyBudget}`
                                : (record.metrics.loss ?? 0).toFixed(3)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 sm:flex-nowrap">
                    <button
                      onClick={() => handleViewDetail(record)}
                      className="flex-1 rounded bg-surface-container-highest py-2 text-[11px] font-bold transition-all hover:bg-primary hover:text-surface"
                    >
                      {isCompleted ? '查看详情' : '查看记录'}
                    </button>
                    <button
                      onClick={() => onAddComparisonSelection(record.taskId)}
                      className="flex-1 rounded bg-surface-container-highest py-2 text-[11px] font-bold transition-all hover:bg-secondary hover:text-surface"
                    >
                      加入对比
                    </button>
                    <button
                      onClick={() => handleReuse(record.id)}
                      disabled={busyId === record.id}
                      className="flex-1 rounded bg-surface-container-highest py-2 text-[11px] font-bold transition-all hover:bg-tertiary hover:text-surface disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === record.id ? '处理中...' : '复用配置'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 pt-4">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:text-primary">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="h-8 w-8 rounded-lg bg-primary text-xs font-bold text-surface">1</button>
            <span className="mx-2 text-xs text-on-surface-variant">共 {filteredRecords.length} 条结果</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:text-primary">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="sticky top-24 rounded-2xl border border-outline-variant/10 bg-surface-container p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-background">详情预览</h2>
              <button className="cursor-pointer text-on-surface-variant transition-colors hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedRecord ? (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">配置参数摘要</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-outline-variant/5 bg-surface-container-low p-3">
                      <p className="mb-1 text-[10px] text-on-surface-variant">学习率</p>
                      <p className="text-xs font-bold">{selectedRecord.keyParams.learningRate}</p>
                    </div>
                    <div className="rounded-lg border border-outline-variant/5 bg-surface-container-low p-3">
                      <p className="mb-1 text-[10px] text-on-surface-variant">本地轮数</p>
                      <p className="text-xs font-bold">{selectedRecord.keyParams.localEpochs}</p>
                    </div>
                    <div className="rounded-lg border border-outline-variant/5 bg-surface-container-low p-3">
                      <p className="mb-1 text-[10px] text-on-surface-variant">差分隐私</p>
                      <p className="text-xs font-bold text-tertiary">
                        {selectedRecord.keyParams.privacyBudget ? `ε=${selectedRecord.keyParams.privacyBudget}` : '未启用'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-outline-variant/5 bg-surface-container-low p-3">
                      <p className="mb-1 text-[10px] text-on-surface-variant">优化器</p>
                      <p className="text-xs font-bold">{selectedRecord.keyParams.optimizer ?? 'AdamW'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">收敛曲线预览</p>
                  <div className="relative flex h-32 items-end gap-1 overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container-low px-2 pb-2">
                    {selectedRecord.previewBars.map((height, index) => (
                      <div
                        key={`${selectedRecord.id}-${index}`}
                        className="flex-1 rounded-t-sm bg-primary/60"
                        style={{height: `${height}%`}}
                      />
                    ))}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent" />
                  </div>
                  <div className="mt-2 flex justify-between px-1">
                    <span className="text-[9px] text-on-surface-variant">Epoch 0</span>
                    <span className="text-[9px] text-on-surface-variant">Epoch 100</span>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  {selectedRecord.summary}
                </div>

                <div className="space-y-3 border-t border-outline-variant/10 pt-4">
                  <button
                    onClick={() => handleViewDetail(selectedRecord)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary py-3 text-sm font-bold text-surface shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <BarChart2 className="h-5 w-5" />
                    生成完整分析报告
                  </button>
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/10 bg-surface-container-highest py-3 text-sm font-bold text-on-background transition-all hover:border-primary/50">
                    <Download className="h-5 w-5" />
                    导出 CSV 原始数据
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={busyId === selectedRecord.id}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-error/10 py-3 text-sm font-bold text-error transition-all hover:bg-error/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-5 w-5" />
                    {busyId === selectedRecord.id ? '正在删除...' : '删除当前记录'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">当前筛选条件下没有可预览的历史实验。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
