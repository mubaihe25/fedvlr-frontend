import React from 'react';
import {Grid2X2, Info} from 'lucide-react';
import {formatPlainValue, summarizeArtifactValue, toChineseLabel} from '../../lib/showcaseFormat';
import {cn} from '../../lib/utils';
import type {ShowcaseModelCapabilityMatrix, ShowcaseModelCapabilityRow} from '../../types/showcase';

interface ModelCapabilityMatrixProps {
  matrix?: ShowcaseModelCapabilityMatrix | null;
}

const statusClasses: Record<string, string> = {
  supported: 'bg-emerald-300/10 text-emerald-100 border-emerald-300/30',
  partial: 'bg-amber-300/10 text-amber-100 border-amber-300/30',
  unsupported: 'bg-rose-300/10 text-rose-100 border-rose-300/30',
  future_adapter: 'bg-cyan-300/10 text-cyan-100 border-cyan-300/30',
  not_tested: 'bg-slate-700/30 text-slate-300 border-slate-600/50',
};

const rowKey = (row: ShowcaseModelCapabilityRow, index: number) =>
  [row.model, row.dataset, row.capability, index].filter(Boolean).join(':');

export const ModelCapabilityMatrix: React.FC<ModelCapabilityMatrixProps> = ({matrix}) => {
  const rows = matrix?.entries ?? [];
  const supportedDemos = matrix?.supportedDemos ?? [];
  const unsupportedReasons = matrix?.unsupportedReasons ?? [];
  const visibleRows = rows.slice(0, 24);

  return (
    <section className="rounded-[24px] border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-md">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
            <Grid2X2 className="h-3.5 w-3.5" />
            模型安全能力矩阵
          </div>
          <h3 className="text-xl font-bold text-white">模型能力与适配边界</h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
            FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态展示主模型。FedAvg Amazon target rank 170 -&gt; 3
            不能泛化到所有模型，暂不支持 / 后续适配表示模型适配边界，不是失败结论。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(matrix?.statusCounts ?? {}).map(([status, count]) => (
            <span
              key={status}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-bold',
                statusClasses[status] ?? 'border-slate-600/50 bg-slate-800 text-slate-300',
              )}
            >
              {toChineseLabel(status)}：{count}
            </span>
          ))}
        </div>
      </div>

      {matrix ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-700/50">
            <div className="grid grid-cols-[1fr_1fr_1.2fr_0.8fr_1.4fr_1.4fr_1.4fr] bg-slate-950/70 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>模型</span>
              <span>数据集</span>
              <span>能力</span>
              <span>状态</span>
              <span>证据</span>
              <span>原因</span>
              <span>推荐展示方式</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {visibleRows.map((row, index) => {
                const status = row.status ?? 'not_available';

                return (
                  <div
                    key={rowKey(row, index)}
                    className="grid grid-cols-1 gap-3 border-t border-slate-700/50 px-4 py-4 text-sm text-slate-100 md:grid-cols-[1fr_1fr_1.2fr_0.8fr_1.4fr_1.4fr_1.4fr]"
                  >
                    <span className="break-words font-semibold">{formatPlainValue(row.model)}</span>
                    <span className="break-words">{formatPlainValue(row.dataset)}</span>
                    <span className="break-words text-xs">{toChineseLabel(row.capability)}</span>
                    <span>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold',
                          statusClasses[status] ?? 'border-slate-600/50 bg-slate-800 text-slate-300',
                        )}
                      >
                        {toChineseLabel(status)}
                      </span>
                    </span>
                    <span className="break-words text-xs leading-5 text-slate-400">{formatPlainValue(row.evidence)}</span>
                    <span className="break-words text-xs leading-5 text-slate-400">{formatPlainValue(row.reason)}</span>
                    <span className="break-words text-xs leading-5 text-slate-400">{formatPlainValue(row.recommendedDemoUsage)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {rows.length > visibleRows.length ? (
            <p className="mt-3 text-xs text-slate-400">当前展示前 {visibleRows.length} 条，共 {rows.length} 条矩阵记录。</p>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-950/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">已支持演示</p>
              <p className="mt-2 text-xs leading-5 text-slate-200">{summarizeArtifactValue(supportedDemos.slice(0, 5))}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-950/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">暂不支持原因</p>
              <p className="mt-2 text-xs leading-5 text-slate-200">{summarizeArtifactValue(unsupportedReasons.slice(0, 5))}</p>
            </div>
          </div>

          {matrix.warnings?.length ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
              <Info className="mt-1 h-4 w-4 shrink-0" />
              <p>{matrix.warnings.join(' / ')}</p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 px-4 py-5 text-sm text-slate-400">
          暂无 / 不适用。请选择“模型安全能力矩阵”场景查看矩阵 artifact。
        </div>
      )}
    </section>
  );
};
