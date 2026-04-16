import React, {useEffect, useMemo, useState} from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {AlertCircle, CheckCircle2, Database, FileText, Info, ShieldCheck, Zap} from 'lucide-react';
import {getAnalysisResult} from '../../services/result';
import {cn} from '../../lib/utils';
import type {AsyncState, ConsoleExperimentContext} from '../../types/common';
import type {AnalysisResultResponse, CurveSeries, ExperimentResult} from '../../types/result';
import type {LaunchExperimentRecord} from '../../types/train';

interface AnalysisProps {
  taskId: string | null;
  lastLaunchRecord: LaunchExperimentRecord | null;
  experimentContext: ConsoleExperimentContext;
}

const cardToneClasses = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  neutral: 'bg-surface-container-highest text-on-surface',
  info: 'bg-primary/10 text-primary',
  success: 'bg-tertiary/10 text-tertiary',
  warning: 'bg-error/10 text-error',
  danger: 'bg-error/10 text-error',
} as const;

const sourceBadgeClasses = {
  'recent-launch': 'border-tertiary/20 bg-tertiary/10 text-tertiary',
  history: 'border-primary/20 bg-primary/10 text-primary',
  mock: 'border-error/20 bg-error/10 text-error',
  'validate-only': 'border-primary/20 bg-primary/10 text-primary',
} as const;

const formatMetricValue = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(3) : '暂无';

const stripAnsiEscapes = (value?: string | null) =>
  (value ?? '').replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');

const buildChartData = (seriesList: CurveSeries[]) => {
  const rows = new Map<number | string, Record<string, string | number>>();

  for (const series of seriesList) {
    for (const point of series.points) {
      const epoch = point.epoch ?? point.round ?? point.label ?? series.key;
      const current = rows.get(epoch) ?? {epoch};
      current[series.key] = Number(point.value ?? 0);
      rows.set(epoch, current);
    }
  }

  return Array.from(rows.values()).sort((left, right) => {
    const leftEpoch = Number(left.epoch);
    const rightEpoch = Number(right.epoch);
    if (Number.isFinite(leftEpoch) && Number.isFinite(rightEpoch)) {
      return leftEpoch - rightEpoch;
    }
    return String(left.epoch).localeCompare(String(right.epoch));
  });
};

const getChartValues = (data: Array<Record<string, string | number>>, seriesList: CurveSeries[]) =>
  data.flatMap((row) =>
    seriesList
      .map((series) => Number(row[series.key]))
      .filter((value) => Number.isFinite(value)),
  );

const getYAxisDomain = (data: Array<Record<string, string | number>>, seriesList: CurveSeries[]) => {
  const values = getChartValues(data, seriesList);
  if (!values.length) {
    return ['auto', 'auto'] as const;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue;
  const padding = span > 0 ? span * 0.12 : Math.max(Math.abs(maxValue || 1) * 0.08, 0.001);

  return [Number((minValue - padding).toFixed(6)), Number((maxValue + padding).toFixed(6))] as const;
};

const getXAxisTicks = (data: Array<Record<string, string | number>>) => {
  const epochs = data.map((row) => row.epoch).filter((epoch) => epoch !== undefined);
  if (epochs.length <= 16) {
    return epochs;
  }

  const step = Math.ceil(epochs.length / 12);
  return epochs.filter((_, index) => index % step === 0 || index === epochs.length - 1);
};

const getChartMinWidth = (pointCount: number) => Math.max(680, pointCount * 34);

interface CurveChartProps {
  title: string;
  description: string;
  seriesList: CurveSeries[];
  data: Array<Record<string, string | number>>;
  emptyText: string;
}

const CurveChart: React.FC<CurveChartProps> = ({title, description, seriesList, data, emptyText}) => {
  const yAxisDomain = getYAxisDomain(data, seriesList);
  const xAxisTicks = getXAxisTicks(data);
  const minWidth = getChartMinWidth(data.length);

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h4 className="font-bold text-on-surface">{title}</h4>
          <p className="mt-1 text-xs text-on-surface-variant">{description}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {seriesList.map((series) => (
            <div key={series.key} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{backgroundColor: series.color}} />
              <span className="text-xs text-on-surface-variant">{series.label}</span>
            </div>
          ))}
        </div>
      </div>
      {data.length && seriesList.length ? (
        <div className="overflow-x-auto pb-2">
          <div className="h-72" style={{minWidth: `${minWidth}px`}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid stroke="#1d2730" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="epoch"
                  stroke="#a5acb4"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  ticks={xAxisTicks}
                  interval={0}
                />
                <YAxis
                  stroke="#a5acb4"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={yAxisDomain}
                  tickFormatter={(value) => formatMetricValue(Number(value))}
                />
                <Tooltip
                  contentStyle={{backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px'}}
                  formatter={(value, name) => [
                    formatMetricValue(Number(value)),
                    seriesList.find((series) => series.key === name)?.label ?? name,
                  ]}
                />
                {seriesList.map((series, index) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={index === 0 ? 3 : 2}
                    strokeDasharray={index === 0 ? undefined : '5 5'}
                    dot={false}
                    activeDot={{r: 6, strokeWidth: 0}}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container text-sm text-on-surface-variant">
          {emptyText}
        </div>
      )}
    </div>
  );
};

export const Analysis: React.FC<AnalysisProps> = ({taskId, lastLaunchRecord, experimentContext}) => {
  const [loadState, setLoadState] = useState<AsyncState>('idle');
  const [analysisState, setAnalysisState] = useState<AnalysisResultResponse | null>(null);
  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!taskId && !lastLaunchRecord) {
      setResult(null);
      setAnalysisState(null);
      setLoadState('empty');
      return () => {
        cancelled = true;
      };
    }

    const loadResult = async () => {
      try {
        setLoadState('loading');
        setErrorMessage('');

        const nextState = await getAnalysisResult({taskId, lastLaunchRecord});
        if (cancelled) {
          return;
        }

        setAnalysisState(nextState);
        setResult(nextState.result);
        setLoadState(nextState.status === 'empty' ? 'empty' : 'success');
      } catch (error) {
        if (!cancelled) {
          setResult(null);
          setAnalysisState(null);
          setLoadState('error');
          setErrorMessage(error instanceof Error ? error.message : '结果加载失败。');
        }
      }
    };

    void loadResult();

    return () => {
      cancelled = true;
    };
  }, [taskId, lastLaunchRecord]);

  const lossSeries = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.curves.loss.points.length ? [result.curves.loss] : [];
  }, [result]);

  const scoreSeries = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.curves.utility.filter((series) => series.points.length);
  }, [result]);

  const lossChartData = useMemo(() => buildChartData(lossSeries), [lossSeries]);
  const scoreChartData = useMemo(() => buildChartData(scoreSeries), [scoreSeries]);
  const validationStdoutTail = stripAnsiEscapes(lastLaunchRecord?.response.stdout_tail);
  const validationStderrTail = stripAnsiEscapes(lastLaunchRecord?.response.stderr_tail);

  if (loadState === 'loading') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center text-on-surface-variant">
        正在加载真实实验结果...
      </div>
    );
  }

  if (analysisState?.status === 'validate-only') {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-10 text-center">
        <h2 className="text-2xl font-bold text-primary">当前仅完成配置校验</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          最近一次提交是 validateOnly / dryRun 模式，尚未启动训练，也没有生成可分析的 summary/result 文件。
        </p>
        {validationStdoutTail || validationStderrTail ? (
          <div className="mt-6 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
            {validationStdoutTail ? (
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="mb-2 text-xs font-bold text-on-surface-variant">校验输出</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-on-surface">
                  {validationStdoutTail}
                </pre>
              </div>
            ) : null}
            {validationStderrTail ? (
              <div className="rounded-xl bg-error/10 p-4">
                <p className="mb-2 text-xs font-bold text-error">错误输出</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-on-surface">
                  {validationStderrTail}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (loadState === 'empty') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center">
        <h2 className="text-2xl font-bold text-on-surface">暂无可分析的实验结果</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          请先启动实验，或从历史实验中选择一条已完成记录。
        </p>
      </div>
    );
  }

  if (loadState === 'error' || !result) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/10 p-10 text-center">
        <h2 className="text-2xl font-bold text-error">结果分析加载失败</h2>
        <p className="mt-3 text-sm text-on-surface-variant">{errorMessage || '请稍后重试。'}</p>
      </div>
    );
  }

  const analysisSource =
    result.source === 'recent-launch'
      ? 'recent-launch'
      : result.source === 'history'
        ? 'history'
        : result.dataSource === 'mock'
          ? 'mock'
          : 'history';
  const isMockReport = analysisSource === 'mock' || result.dataSource === 'mock';

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-on-surface">单次实验分析报告</h2>
            <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', sourceBadgeClasses[analysisSource])}>
              {analysisSource === 'recent-launch'
                ? '最近一次真实实验结果'
                : analysisSource === 'history'
                  ? '历史实验真实结果'
                  : '示例报告'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            实验标识：<span className="font-mono text-primary">{result.experimentId ?? result.taskId}</span> | 数据来源：
            {result.dataSourceLabel ?? analysisState?.dataSourceLabel ?? '未知'}
          </p>
          <p className="text-xs text-on-surface-variant">
            当前上下文：{experimentContext.dataSourceLabel}
            {experimentContext.analysisLockedToHistory ? '，已锁定历史实验记录' : ''}
          </p>
        </div>
      </div>

      {isMockReport || result.fallbackReason || analysisState?.fallbackReason ? (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-on-surface">
          {isMockReport
            ? '当前显示的是示例报告，不是真实实验结果。'
            : '当前已回退到可用的真实摘要级结果。'}
          {result.fallbackReason ?? analysisState?.fallbackReason ? `原因：${result.fallbackReason ?? analysisState?.fallbackReason}` : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        {result.metricCards.map((metric) => (
          <div key={metric.label} className="glass-panel rounded-2xl border-l-4 border-primary p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className={cn('rounded-lg p-2', cardToneClasses[metric.tone] ?? cardToneClasses.neutral)}>
                {metric.label.includes('Recall') ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : metric.label.includes('NDCG') ? (
                  <Zap className="h-5 w-5" />
                ) : metric.label.includes('Loss') ? (
                  <FileText className="h-5 w-5" />
                ) : (
                  <Database className="h-5 w-5" />
                )}
              </div>
              <span className="rounded bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                {metric.change}
              </span>
            </div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{metric.label}</p>
            <p className="text-2xl font-bold text-on-surface">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="glass-panel rounded-2xl p-8 lg:col-span-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold">真实轮次曲线</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              训练损失与验证/测试主指标分开展示；长轮次实验支持横向滚动查看完整区间。
            </p>
          </div>
          <div className="space-y-6">
            <CurveChart
              title="训练损失曲线"
              description="仅使用 round_summaries / round_metrics 中的训练损失字段。"
              seriesList={lossSeries}
              data={lossChartData}
              emptyText="当前结果文件没有可绘制的训练损失字段。"
            />
            <CurveChart
              title="验证/测试主指标曲线"
              description="使用真实 valid_score / test_score 字段，按后端主评估指标记录展示。"
              seriesList={scoreSeries}
              data={scoreChartData}
              emptyText="当前结果文件没有可绘制的验证/测试主指标字段。"
            />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8 lg:col-span-4">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
            <Info className="h-5 w-5 text-primary" />
            实验概述
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
              <span className="text-on-surface-variant">模型</span>
              <span className="font-semibold text-on-surface">{result.model}</span>
            </div>
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
              <span className="text-on-surface-variant">数据集</span>
              <span className="font-semibold text-on-surface">{result.dataset}</span>
            </div>
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
              <span className="text-on-surface-variant">场景</span>
              <span className="font-semibold text-on-surface">{result.configSummary.modeLabel}</span>
            </div>
            <div className="border-b border-outline-variant/10 pb-3">
              <span className="text-on-surface-variant">投毒攻击</span>
              <p className="mt-1 font-semibold text-on-surface">
                {result.configSummary.poisoningAttackLabel ?? result.configSummary.attackLabel}
              </p>
            </div>
            <div className="border-b border-outline-variant/10 pb-3">
              <span className="text-on-surface-variant">隐私泄露观测</span>
              <p className="mt-1 font-semibold text-on-surface">
                {result.configSummary.privacyProbeLabel ?? '未启用'}
              </p>
            </div>
            <div className="border-b border-outline-variant/10 pb-3">
              <span className="text-on-surface-variant">鲁棒防御</span>
              <p className="mt-1 font-semibold text-on-surface">{result.configSummary.defenseLabel}</p>
            </div>
            <div>
              <span className="text-on-surface-variant">观测模块</span>
              <p className="mt-1 font-semibold text-on-surface">
                {result.configSummary.observationLabel ?? result.configSummary.privacyLevel}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8 lg:col-span-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h4 className="font-bold">核心结论</h4>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{result.summaryText.conclusion}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-tertiary">
                <ShieldCheck className="h-5 w-5" />
                <h4 className="font-bold">安全观察</h4>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{result.summaryText.securityAssessment}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-secondary">
                <AlertCircle className="h-5 w-5" />
                <h4 className="font-bold">说明</h4>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{result.summaryText.recommendation}</p>
            </div>
          </div>

          {result.securityObservations?.length ? (
            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-5">
              {result.securityObservations.map((item) => (
                <div key={item.label} className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold text-on-surface-variant">{item.label}</p>
                  <p className="mt-2 text-xl font-bold text-on-surface">{item.value}</p>
                  <p className="mt-1 text-[10px] text-on-surface-variant">{item.change}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
