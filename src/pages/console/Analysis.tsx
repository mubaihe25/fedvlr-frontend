import React, {useEffect, useState} from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {AlertCircle, CheckCircle2, FileText, ShieldCheck, Zap} from 'lucide-react';
import {getHistoryFallbackResult, getResult} from '../../services/result';
import {cn} from '../../lib/utils';
import type {AsyncState} from '../../types/common';
import type {ExperimentResult} from '../../types/result';

interface AnalysisProps {
  taskId: string | null;
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

export const Analysis: React.FC<AnalysisProps> = ({taskId}) => {
  const [loadState, setLoadState] = useState<AsyncState>('idle');
  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [showingFallback, setShowingFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!taskId) {
      setResult(null);
      setShowingFallback(false);
      setLoadState('empty');
      return () => {
        cancelled = true;
      };
    }

    const loadResult = async () => {
      try {
        setLoadState('loading');
        setErrorMessage('');

        const currentResult = await getResult(taskId);
        if (cancelled) {
          return;
        }

        if (currentResult) {
          setResult(currentResult);
          setShowingFallback(false);
          setLoadState('success');
          return;
        }

        const fallbackResult = await getHistoryFallbackResult();
        if (!cancelled) {
          setResult(fallbackResult);
          setShowingFallback(true);
          setLoadState('success');
        }
      } catch (error) {
        if (!cancelled) {
          setResult(null);
          setLoadState('error');
          setErrorMessage(error instanceof Error ? error.message : '结果加载失败。');
        }
      }
    };

    loadResult();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (loadState === 'loading') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center text-on-surface-variant">
        正在加载实验结果...
      </div>
    );
  }

  if (loadState === 'empty') {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-10 text-center">
        <h2 className="text-2xl font-bold text-on-surface">暂无可分析的实验结果</h2>
        <p className="mt-3 text-sm text-on-surface-variant">请先运行实验，或从历史实验中选择一条已完成记录。</p>
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

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-on-surface">单次实验分析报告</h2>
          </div>
          <p className="text-sm text-on-surface-variant">
            实验任务：<span className="font-mono text-primary">{result.taskId}</span> | 生成时间：{result.timestamp}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg bg-surface-container-highest px-6 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-high">
            导出 PDF
          </button>
          <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-surface shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
            分享报告
          </button>
        </div>
      </div>

      {showingFallback ? (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-on-surface">
          当前任务尚未生成完整结果，页面已自动回退到最近一条历史实验结果用于展示。
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {result.metricCards.map((metric) => (
          <div key={metric.label} className="glass-panel rounded-2xl border-l-4 border-primary p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className={cn('rounded-lg p-2', cardToneClasses[metric.tone] ?? cardToneClasses.neutral)}>
                {metric.label.includes('Recall') ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : metric.label.includes('NDCG') ? (
                  <Zap className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <span className="rounded bg-tertiary/10 px-2 py-0.5 text-[10px] font-bold text-tertiary">{metric.change}</span>
            </div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{metric.label}</p>
            <p className="text-2xl font-bold text-on-surface">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="glass-panel relative overflow-hidden rounded-2xl p-8 text-center lg:col-span-4">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-tertiary to-primary" />
          <h3 className="mb-8 text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant">防御效能评分</h3>
          <div className="relative mx-auto mb-8 h-48 w-48">
            <svg className="h-48 w-48 -rotate-90 transform">
              <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-surface-container-highest" />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={552}
                strokeDashoffset={552 * (1 - result.defenseEfficiencyScore / 100)}
                className="text-tertiary drop-shadow-[0_0_15px_rgba(175,255,209,0.4)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-on-surface">{result.defenseEfficiencyScore.toFixed(1)}</span>
              <span className="text-xs font-bold text-on-surface-variant">/ 100</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-tertiary">{result.defenseEfficiencyLabel}</p>
            <p className="text-xs leading-relaxed text-on-surface-variant">{result.summaryText.headline}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8 lg:col-span-8">
          <div className="mb-12 flex items-center justify-between">
            <h3 className="text-lg font-bold">效能演进曲线</h3>
            <div className="flex gap-4">
              {result.curves.utility.map((series) => (
                <div key={series.key} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{backgroundColor: series.color}} />
                  <span className="text-xs text-on-surface-variant">{series.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={result.curves.utility[0]?.points.map((point, index) => ({
                  epoch: point.epoch,
                  [result.curves.utility[0].key]: point.value,
                  [result.curves.utility[1]?.key ?? 'baseline']:
                    result.curves.utility[1]?.points[index]?.value ?? point.value,
                }))}
              >
                <CartesianGrid stroke="#1d2730" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="epoch" stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px'}} />
                {result.curves.utility.map((series, index) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={index === 0 ? 4 : 2}
                    strokeDasharray={index === 0 ? undefined : '5 5'}
                    dot={false}
                    activeDot={{r: 6, strokeWidth: 0}}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8 lg:col-span-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
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
                <h4 className="font-bold">安全评估</h4>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{result.summaryText.securityAssessment}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-secondary">
                <AlertCircle className="h-5 w-5" />
                <h4 className="font-bold">优化建议</h4>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{result.summaryText.recommendation}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <h4 className="font-bold">配置摘要</h4>
              </div>
              <div className="space-y-2 text-sm text-on-surface-variant">
                <p>数据集：{result.configSummary.datasetLabel}</p>
                <p>模型：{result.configSummary.modelLabel}</p>
                <p>实验模式：{result.configSummary.modeLabel}</p>
                <p>攻击策略：{result.configSummary.attackLabel}</p>
                <p>防御机制：{result.configSummary.defenseLabel}</p>
              </div>
            </div>
          </div>

          {result.referenceComparison ? (
            <div className="mt-8 rounded-xl border border-primary/10 bg-surface-container-low p-5">
              <h4 className="font-bold text-primary">{result.referenceComparison.title}</h4>
              <p className="mt-2 text-sm text-on-surface-variant">{result.referenceComparison.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
