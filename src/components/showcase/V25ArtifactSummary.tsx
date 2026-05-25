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
    <section className="sandbox-panel rounded-[28px] p-6">
      <div className="mb-5 flex items-start gap-3">
        <Activity className="mt-1 h-5 w-5 text-cyan-100" />
        <div>
          <h3 className="text-xl font-bold text-white">V2.5 后端冒烟证据</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            该摘要只展示后端冒烟 artifact。target rank 170 -&gt; 3 是 FedAvg + Amazon 的单场景观察；masked TopK hit 为 0 时不写成攻击成功。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <ScenarioMetricCard label="目标排序" value={rankText} description="rank 前移是诊断信号，不等同于通用攻击成功。" tone="error" />
        <ScenarioMetricCard
          label="分数增益"
          value={formatMetricValue(summary.scoreGain)}
          description="未屏蔽排序分数增益，缺失时显示暂无 / 不适用。"
          tone="secondary"
        />
        <ScenarioMetricCard
          label="最终推荐命中"
          value={summary.maskedTopkHitRate === 0 ? '未命中' : formatPercentValue(summary.maskedTopkHitRate)}
          description={summary.maskedTopkHitRate === 0 ? '仍为 0，不能写成目标进入 TopK。' : '以 artifact 字段为准。'}
          tone={summary.maskedTopkHitRate === 0 ? 'neutral' : 'error'}
        />
        <ScenarioMetricCard
          label="交互还原 hit@10/20/50"
          value={[
            formatMetricValue(summary.interactionReconstructionHit10),
            formatMetricValue(summary.interactionReconstructionHit20),
            formatMetricValue(summary.interactionReconstructionHit50),
          ].join(' / ')}
          description={`状态：${formatPlainValue(summary.interactionReconstructionStatus)}`}
          tone="primary"
        />
        <ScenarioMetricCard label="成员推断 AUC" value={formatMetricValue(summary.miaAuc)} description="代理证据，不代表所有隐私攻击场景。" tone="secondary" />
        <ScenarioMetricCard
          label="安全聚合残差"
          value={summary.secAggResidual === 0 ? '≈0' : formatMetricValue(summary.secAggResidual)}
          description="安全聚合模拟，不是生产级协议。"
          tone="tertiary"
        />
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-50">
        <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
        <p>
          Opacus：{formatPlainValue(summary.opacusStatus)}。{formatPlainValue(summary.opacusBoundary)}
          {summary.warnings?.length ? ` / ${summary.warnings.join(' / ')}` : ''}
        </p>
      </div>
    </section>
  );
};
