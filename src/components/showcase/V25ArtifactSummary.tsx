import React from 'react';
import {Activity, AlertTriangle} from 'lucide-react';
import {EMPTY_VALUE, formatMetricValue, formatPercentValue, formatPlainValue} from '../../lib/showcaseFormat';
import type {ShowcaseV25Summary} from '../../types/showcase';
import {ScenarioMetricCard} from './ScenarioMetricCard';

interface V25ArtifactSummaryProps {
  summary?: ShowcaseV25Summary | null;
}

export const V25ArtifactSummary: React.FC<V25ArtifactSummaryProps> = ({summary}) => {
  if (!summary) {
    return null;
  }

  const rankText =
    typeof summary.targetRankBefore === 'number' && typeof summary.targetRankAfter === 'number'
      ? `${summary.targetRankBefore} -> ${summary.targetRankAfter}`
      : EMPTY_VALUE;

  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
      <div className="mb-5 flex items-start gap-3">
        <Activity className="mt-1 h-5 w-5 text-primary" />
        <div>
          <h3 className="text-xl font-bold text-on-surface">V2.5 backend smoke artifact</h3>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            该摘要只展示 V2.5 smoke 证据：target rank 170 -&gt; 3 是 FedAvg + Amazon 的单场景观测，masked TopK hit 仍为 0
            时不写成攻击成功。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <ScenarioMetricCard label="target rank" value={rankText} description="rank 前移是诊断信号，不等同于通用攻击成功。" tone="error" />
        <ScenarioMetricCard
          label="score gain"
          value={formatMetricValue(summary.scoreGain)}
          description="unmasked score gain；缺失时显示暂无 / 不适用。"
          tone="secondary"
        />
        <ScenarioMetricCard
          label="masked TopK hit"
          value={formatPercentValue(summary.maskedTopkHitRate)}
          description={summary.maskedTopkHitRate === 0 ? '仍为 0，不能写成 target TopK 命中。' : '以 artifact 字段为准。'}
          tone={summary.maskedTopkHitRate === 0 ? 'neutral' : 'error'}
        />
        <ScenarioMetricCard
          label="interaction hit@10/20/50"
          value={[
            formatMetricValue(summary.interactionReconstructionHit10),
            formatMetricValue(summary.interactionReconstructionHit20),
            formatMetricValue(summary.interactionReconstructionHit50),
          ].join(' / ')}
          description={`status: ${formatPlainValue(summary.interactionReconstructionStatus)}`}
          tone="primary"
        />
        <ScenarioMetricCard label="MIA AUC" value={formatMetricValue(summary.miaAuc)} description="score-based / proxy evidence only." tone="secondary" />
        <ScenarioMetricCard
          label="SecAgg residual"
          value={formatMetricValue(summary.secAggResidual)}
          description="secure aggregation demo/simulation only."
          tone="tertiary"
        />
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm leading-6 text-on-surface">
        <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-secondary" />
        <p>
          Opacus: {formatPlainValue(summary.opacusStatus)}。{formatPlainValue(summary.opacusBoundary)}
          {summary.warnings?.length ? ` / ${summary.warnings.join(' / ')}` : ''}
        </p>
      </div>
    </section>
  );
};
