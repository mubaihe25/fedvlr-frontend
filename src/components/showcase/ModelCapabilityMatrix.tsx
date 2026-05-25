import React from 'react';
import {Grid2X2, Info} from 'lucide-react';
import {formatPlainValue, summarizeArtifactValue} from '../../lib/showcaseFormat';
import {cn} from '../../lib/utils';
import type {ShowcaseModelCapabilityMatrix, ShowcaseModelCapabilityRow} from '../../types/showcase';

interface ModelCapabilityMatrixProps {
  matrix?: ShowcaseModelCapabilityMatrix | null;
}

const statusClasses: Record<string, string> = {
  supported: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  partial: 'bg-secondary/10 text-secondary border-secondary/20',
  unsupported: 'bg-error/10 text-error border-error/20',
  future_adapter: 'bg-primary/10 text-primary border-primary/20',
  not_tested: 'bg-surface-container-highest text-on-surface-variant border-outline-variant/10',
};

const statusLabel = (status?: string | null) => {
  if (!status) {
    return 'not_available';
  }
  return status;
};

const rowKey = (row: ShowcaseModelCapabilityRow, index: number) =>
  [row.model, row.dataset, row.capability, index].filter(Boolean).join(':');

export const ModelCapabilityMatrix: React.FC<ModelCapabilityMatrixProps> = ({matrix}) => {
  const rows = matrix?.entries ?? [];
  const supportedDemos = matrix?.supportedDemos ?? [];
  const unsupportedReasons = matrix?.unsupportedReasons ?? [];
  const visibleRows = rows.slice(0, 24);

  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Grid2X2 className="h-3.5 w-3.5" />
            model_security_capability_matrix
          </div>
          <h3 className="text-xl font-bold text-on-surface">模型安全能力矩阵</h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-on-surface-variant">
            FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型。FedAvg Amazon target rank 170 -&gt; 3
            不能泛化到所有模型，unsupported / future_adapter 表示模型适配边界，不是失败结论。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(matrix?.statusCounts ?? {}).map(([status, count]) => (
            <span
              key={status}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-bold',
                statusClasses[status] ?? 'border-outline-variant/10 bg-surface-container-high text-on-surface-variant',
              )}
            >
              {status}: {count}
            </span>
          ))}
        </div>
      </div>

      {matrix ? (
        <>
          <div className="overflow-hidden rounded-xl border border-outline-variant/10">
            <div className="grid grid-cols-[1fr_1fr_1.2fr_0.8fr_1.4fr_1.4fr_1.4fr] bg-surface-container-highest px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span>model</span>
              <span>dataset</span>
              <span>capability</span>
              <span>status</span>
              <span>evidence</span>
              <span>reason</span>
              <span>recommended_demo_usage</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {visibleRows.map((row, index) => {
                const status = statusLabel(row.status);

                return (
                  <div
                    key={rowKey(row, index)}
                    className="grid grid-cols-1 gap-3 border-t border-outline-variant/10 px-4 py-4 text-sm text-on-surface md:grid-cols-[1fr_1fr_1.2fr_0.8fr_1.4fr_1.4fr_1.4fr]"
                  >
                    <span className="break-words font-semibold">{formatPlainValue(row.model)}</span>
                    <span className="break-words">{formatPlainValue(row.dataset)}</span>
                    <span className="break-words font-mono text-xs">{formatPlainValue(row.capability)}</span>
                    <span>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold',
                          statusClasses[status] ?? 'border-outline-variant/10 bg-surface-container-highest text-on-surface-variant',
                        )}
                      >
                        {status}
                      </span>
                    </span>
                    <span className="break-words text-xs leading-5 text-on-surface-variant">{formatPlainValue(row.evidence)}</span>
                    <span className="break-words text-xs leading-5 text-on-surface-variant">{formatPlainValue(row.reason)}</span>
                    <span className="break-words text-xs leading-5 text-on-surface-variant">{formatPlainValue(row.recommendedDemoUsage)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {rows.length > visibleRows.length ? (
            <p className="mt-3 text-xs text-on-surface-variant">当前展示前 {visibleRows.length} 条，共 {rows.length} 条矩阵记录。</p>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl bg-surface-container-high p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">supported_demos</p>
              <p className="mt-2 text-xs leading-5 text-on-surface">{summarizeArtifactValue(supportedDemos.slice(0, 5))}</p>
            </div>
            <div className="rounded-xl bg-surface-container-high p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">unsupported_reasons</p>
              <p className="mt-2 text-xs leading-5 text-on-surface">{summarizeArtifactValue(unsupportedReasons.slice(0, 5))}</p>
            </div>
          </div>

          {matrix.warnings?.length ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm leading-6 text-on-surface">
              <Info className="mt-1 h-4 w-4 shrink-0 text-secondary" />
              <p>{matrix.warnings.join(' / ')}</p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-5 text-sm text-on-surface-variant">
          暂无 / 不适用。请选择 model_security_capability_matrix 场景查看矩阵 artifact。
        </div>
      )}
    </section>
  );
};
