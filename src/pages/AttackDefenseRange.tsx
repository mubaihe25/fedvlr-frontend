import React from 'react';
import {AlertTriangle, ArrowRight, BarChart3, Info, Network, ShieldCheck, Swords, Target, Users} from 'lucide-react';
import {DefenseTraceCard} from '../components/showcase/DefenseTraceCard';
import {RecommendationList} from '../components/showcase/RecommendationList';
import {ScenarioMetricCard} from '../components/showcase/ScenarioMetricCard';
import {ShowcasePageHeader} from '../components/showcase/ShowcasePageHeader';
import {ShowcaseScenarioSelector} from '../components/showcase/ShowcaseScenarioSelector';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {
  EMPTY_VALUE,
  formatMetricValue,
  formatPercentValue,
  formatPlainValue,
  getBoundaryItems,
  getDatasetLabel,
} from '../lib/showcaseFormat';
import type {ShowcaseTargetRankEntry} from '../types/showcase';

const flowNodes = [
  {
    title: '正常客户端更新',
    description: '多数客户端上传与本地偏好一致的共享更新。',
    icon: Users,
    tone: 'border-primary/20 bg-primary/10 text-primary',
  },
  {
    title: '恶意客户端更新',
    description: '恶意客户端构造偏向目标物品的异常更新。',
    icon: Swords,
    tone: 'border-error/20 bg-error/10 text-error',
  },
  {
    title: '目标操纵观测',
    description: '观察 target rank 和 score gain，不把排名前移直接写成 Top50 命中。',
    icon: Target,
    tone: 'border-error/20 bg-error/10 text-error',
  },
  {
    title: '鲁棒防御处理',
    description: 'Krum、截尾均值、中位数等链路按 artifact 可用性展示。',
    icon: ShieldCheck,
    tone: 'border-tertiary/20 bg-tertiary/10 text-tertiary',
  },
  {
    title: '服务端聚合',
    description: '服务端聚合共享更新并下发下一轮参数。',
    icon: Network,
    tone: 'border-secondary/20 bg-secondary/10 text-secondary',
  },
  {
    title: '推荐结果恢复',
    description: '正常兴趣物品回升，异常物品是否进入 Top50 以 target_hit_rate 为准。',
    icon: BarChart3,
    tone: 'border-tertiary/20 bg-tertiary/10 text-tertiary',
  },
];

const getRankMove = (entry: ShowcaseTargetRankEntry) => {
  if (typeof entry.rankGain === 'number') {
    return entry.rankGain;
  }
  if (typeof entry.baselineRank === 'number' && typeof entry.attackRank === 'number') {
    return entry.baselineRank - entry.attackRank;
  }
  return null;
};

export const AttackDefenseRange: React.FC = () => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const {selectedScenario, report} = bundle;
  const datasetProfile = report.datasetProfile;
  const metrics = report.metricsSummary;
  const recommendations = report.recommendationComparison;
  const targetRankSummary = report.targetRankSummary;
  const boundaryItems = getBoundaryItems(report, selectedScenario);
  const targetEntries = targetRankSummary?.entries ?? [];
  const targetHitRate = targetRankSummary?.targetHitRate ?? metrics?.targetHitRate;

  return (
    <div className="space-y-8 pb-12">
      <ShowcasePageHeader
        eyebrow="选拔赛展示链路"
        title="攻防靶场"
        description="优先读取 FedVLR-API showcase artifacts，展示 KU/MMFedRAP、Amazon 商品推荐安全 smoke、target rank 操纵和 Krum/security matrix 等攻防结果。"
        chips={['API artifacts 优先，mock 兜底', 'Recall@50 / NDCG@50 / recall_drop / recovery_rate', 'target_hit_rate=0 按未命中展示']}
        icon={Swords}
        tone="error"
      />

      <ShowcaseScenarioSelector bundle={bundle} isLoading={isLoading} onScenarioChange={setSelectedScenarioId} />

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="mb-2 font-mono text-xs font-bold text-primary">{selectedScenario.scenarioId}</p>
            <h3 className="text-2xl font-bold text-on-surface">{report.title ?? selectedScenario.name}</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-on-surface-variant">
              数据集：{getDatasetLabel(datasetProfile)}；模型：{formatPlainValue(report.model ?? selectedScenario.model)}。
              {report.warnings?.length ? ` ${report.warnings.join(' / ')}` : ''}
            </p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {bundle.dataSource === 'api' ? 'API artifact' : bundle.dataSource === 'mixed' ? 'API + fallback' : 'mock fallback'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {label: '场景', value: selectedScenario.name},
            {label: '数据集', value: report.dataset ?? selectedScenario.dataset ?? datasetProfile?.dataset ?? datasetProfile?.name},
            {label: '模型', value: report.model ?? selectedScenario.model},
            {label: '标签', value: selectedScenario.tags?.join(' / ')},
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-container-high p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              <p className="mt-2 break-words text-sm font-semibold text-on-surface">{formatPlainValue(item.value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex items-center gap-3">
          <Network className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-on-surface">攻防验证流程</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_24px_1fr_24px_1fr_24px_1fr_24px_1fr_24px_1fr] xl:items-stretch">
          {flowNodes.map((node, index) => (
            <React.Fragment key={node.title}>
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${node.tone}`}>
                  <node.icon className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-on-surface">{node.title}</h4>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">{node.description}</p>
              </div>
              {index < flowNodes.length - 1 ? (
                <div className="flex items-center justify-center text-primary/70">
                  <ArrowRight className="h-5 w-5 rotate-90 xl:rotate-0" />
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <ScenarioMetricCard
          label="Baseline Recall@50"
          value={formatMetricValue(metrics?.baseline?.recall50)}
          description="基线推荐效果，用作攻防对照起点。"
          tone="primary"
        />
        <ScenarioMetricCard
          label="Attack Recall@50"
          value={formatMetricValue(metrics?.attack?.recall50)}
          description="投毒或目标操纵后推荐效果。"
          tone="error"
        />
        <ScenarioMetricCard
          label="Defense Recall@50"
          value={formatMetricValue(metrics?.defense?.recall50)}
          description="鲁棒防御或安全矩阵处理后的效果。"
          tone="tertiary"
        />
        <ScenarioMetricCard
          label="NDCG@50"
          value={formatMetricValue(metrics?.defense?.ndcg50 ?? metrics?.baseline?.ndcg50 ?? metrics?.attack?.ndcg50)}
          description={`B ${formatMetricValue(metrics?.baseline?.ndcg50)} / A ${formatMetricValue(metrics?.attack?.ndcg50)} / D ${formatMetricValue(metrics?.defense?.ndcg50)}`}
          tone="secondary"
        />
        <ScenarioMetricCard
          label="recall_drop"
          value={formatPercentValue(metrics?.recallDrop)}
          description={`NDCG drop ${formatPercentValue(metrics?.ndcgDrop)}。`}
          tone="error"
        />
        <ScenarioMetricCard
          label="recovery_rate"
          value={formatPercentValue(metrics?.recoveryRate)}
          description="字段缺失或空值时显示暂无 / 不适用。"
          tone="tertiary"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RecommendationList
          title="baseline"
          description="正常或基线推荐列表；若 artifact 提供 title/category/image_url，会优先展示商品信息。"
          items={recommendations?.baseline ?? []}
          tone="baseline"
        />
        <RecommendationList
          title="attack"
          description="攻击后推荐列表；score 缺失时不展示假分数。"
          items={recommendations?.attack ?? []}
          tone="attack"
        />
        <RecommendationList
          title="defense"
          description="防御后推荐列表；只有 item_id/rank 时仍展示基础排序。"
          items={recommendations?.defense ?? []}
          tone="defense"
        />
      </section>

      <section className="rounded-2xl border border-error/20 bg-surface-container-low p-6">
        <div className="mb-5 flex items-start gap-3">
          <Target className="mt-1 h-5 w-5 text-error" />
          <div>
            <h3 className="text-xl font-bold text-on-surface">目标操纵区</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              展示 target_rank_summary / target_rank_comparison。rank 前移不等于进入 Top50；target_hit_rate=0 时按未命中展示。
            </p>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <ScenarioMetricCard
            label="target_hit_rate"
            value={formatPercentValue(targetHitRate)}
            description={targetHitRate === 0 ? '当前 artifact 显示 0，按未命中 Top50 展示。' : '是否命中 Top50 以该字段为准。'}
            tone={targetHitRate === 0 ? 'neutral' : 'error'}
          />
          <ScenarioMetricCard
            label="target entries"
            value={String(targetEntries.length)}
            description={targetRankSummary?.note ?? EMPTY_VALUE}
            tone="secondary"
          />
          <ScenarioMetricCard
            label="Top50 判定"
            value={targetEntries.some((entry) => entry.inTop50) ? '有命中' : EMPTY_VALUE}
            description="rank 前移是排名变化，不自动等同于 Top50 命中。"
            tone="neutral"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {targetEntries.length ? (
            targetEntries.map((entry, index) => {
              const rankMove = getRankMove(entry);

              return (
                <div key={`${entry.itemId ?? index}`} className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-error/10 px-2.5 py-1 text-[11px] font-bold text-error">
                      {entry.title ?? entry.itemId ?? `target-${index + 1}`}
                    </span>
                    <span className="rounded-full bg-surface-container-highest px-2.5 py-1 text-[11px] text-on-surface-variant">
                      in Top50: {entry.inTop50 === true ? 'yes' : entry.inTop50 === false ? 'no' : EMPTY_VALUE}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                      {label: 'baseline rank', value: entry.baselineRank},
                      {label: 'attack rank', value: entry.attackRank},
                      {label: 'rank 前移', value: rankMove},
                      {label: 'score gain', value: entry.scoreGain},
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-surface-container-highest px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
                        <p className="mt-1 font-mono text-sm font-bold text-on-surface">{formatPlainValue(item.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-5 text-sm text-on-surface-variant">
              暂无 / 不适用
            </div>
          )}
        </div>
      </section>

      <DefenseTraceCard trace={report.defenseTrace} />

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex items-start gap-3">
          <Info className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-on-surface">边界说明</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              页面会直接展示 smoke、proxy、demo_only、not_available 等 artifact 边界，避免把占位、代理或模拟结果写成完整实现。
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {boundaryItems.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl bg-surface-container-high px-4 py-3 text-sm leading-6 text-on-surface">
              <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-secondary" />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">下一步</p>
            <h3 className="mt-2 text-xl font-bold text-on-surface">实验结果</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              继续查看 metrics_summary、attack_defense_summary、privacy_risk_summary 和推荐对比摘要。
            </p>
          </div>
          <ArrowRight className="h-6 w-6 text-primary" />
        </div>
      </section>
    </div>
  );
};
