import React from 'react';
import {AlertTriangle, CheckCircle2, Database, Layers, Loader2} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {ShowcaseBundle} from '../../types/showcase';

interface ShowcaseScenarioSelectorProps {
  bundle: ShowcaseBundle;
  isLoading?: boolean;
  onScenarioChange: (scenarioId: string) => void;
}

const sourceLabel = {
  api: 'API artifact',
  mock: 'API 未连接 / 演示数据',
  mixed: 'API artifact（部分缺失）',
} as const;

const flagLabels = [
  {key: 'smoke', label: '快速冒烟'},
  {key: 'proxy', label: '代理证据'},
  {key: 'demo', label: '演示验证'},
  {key: 'demoOnly', label: '仅作演示'},
  {key: 'unavailable', label: '暂无数据'},
  {key: 'notAvailable', label: '不适用'},
] as const;

export const ShowcaseScenarioSelector: React.FC<ShowcaseScenarioSelectorProps> = ({bundle, isLoading = false, onScenarioChange}) => (
  <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
    <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
          场景选择
        </div>
        <h3 className="text-xl font-bold text-on-surface">真实 showcase artifacts</h3>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          当前场景来源：{sourceLabel[bundle.scenarioSource]}；页面数据来源：{sourceLabel[bundle.dataSource]}。
          {bundle.fallbackReason ? ' API 未连接时才切换到演示数据。' : ''}
        </p>
      </div>
      <span className="rounded-full border border-outline-variant/10 bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface">
        {bundle.scenarios.length} 个场景
      </span>
    </div>

    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {bundle.scenarios.map((scenario) => {
        const isActive = scenario.scenarioId === bundle.selectedScenario.scenarioId;
        const flags = flagLabels.filter((flag) => Boolean(scenario[flag.key]));

        return (
          <button
            key={scenario.scenarioId}
            type="button"
            onClick={() => onScenarioChange(scenario.scenarioId)}
            className={cn(
              'rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5',
              isActive
                ? 'border-primary/30 bg-primary/10'
                : 'border-outline-variant/10 bg-surface-container-high hover:border-primary/20',
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-primary">artifact 场景</p>
                <h4 className="mt-1 text-base font-bold text-on-surface">{scenario.name}</h4>
              </div>
              {isActive ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /> : null}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-surface-container-highest px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">数据集</p>
                <p className="mt-1 break-words text-xs font-semibold text-on-surface">{scenario.dataset ?? '暂无 / 不适用'}</p>
              </div>
              <div className="rounded-lg bg-surface-container-highest px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">模型</p>
                <p className="mt-1 break-words text-xs font-semibold text-on-surface">{scenario.model ?? '暂无 / 不适用'}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(scenario.tags ?? []).slice(0, 5).map((tag) => (
                <span key={tag} className="rounded-full bg-surface-container-highest px-2 py-1 text-[10px] text-on-surface">
                  {tag}
                </span>
              ))}
              <span
                className={cn(
                  'rounded-full px-2 py-1 text-[10px] font-bold',
                  scenario.dataSource === 'api' ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error',
                )}
              >
                {scenario.dataSource === 'api' ? 'API' : '演示数据'}
              </span>
              {flags.map((flag) => (
                <span key={flag.key} className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-bold text-secondary">
                  {flag.label}
                </span>
              ))}
            </div>

            {scenario.warnings?.length ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-xs leading-5 text-on-surface">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" />
                <span>{scenario.warnings.slice(0, 2).join(' / ')}</span>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>

    {bundle.fallbackReason ? (
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-on-surface">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-error" />
        <p className="break-words">API 未连接原因：{bundle.fallbackReason}</p>
      </div>
    ) : null}
  </section>
);
