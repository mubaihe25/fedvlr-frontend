import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Copy,
  Database,
  Download,
  FileText,
  Home,
  ShieldCheck,
  Swords,
  Terminal,
  Users,
} from 'lucide-react';
import {ScenarioMetricCard} from '../components/showcase/ScenarioMetricCard';
import {ShowcasePageHeader} from '../components/showcase/ShowcasePageHeader';
import {ShowcaseScenarioSelector} from '../components/showcase/ShowcaseScenarioSelector';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {
  formatMetricValue,
  formatPercentValue,
  formatPlainValue,
  getBoundaryItems,
  getDatasetLabel,
  getRecommendationCounts,
  summarizeArtifactValue,
} from '../lib/showcaseFormat';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readDeliveryText = (delivery: unknown, key: string) => {
  if (!isRecord(delivery)) {
    return null;
  }
  const value = delivery[key];
  return typeof value === 'string' ? value : null;
};

export const DeliveryReport: React.FC = () => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const {report, selectedScenario} = bundle;
  const metrics = report.metricsSummary;
  const recommendationCounts = getRecommendationCounts(report.recommendationComparison);
  const boundaryItems = getBoundaryItems(report, selectedScenario);
  const sectionCards = [
    {
      title: '已实现能力',
      description:
        readDeliveryText(report.delivery, 'systemSummary') ??
        '前端已接入只读 showcase artifacts，可展示 dataset_profile、metrics_summary、recommendation_comparison 和 security/privacy 摘要。',
      icon: Database,
      tone: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      title: '可展示结果',
      description:
        readDeliveryText(report.delivery, 'metricsSummary') ??
        `当前场景可展示 baseline/attack/defense 推荐数 ${recommendationCounts.baseline}/${recommendationCounts.attack}/${recommendationCounts.defense}，以及 Recall@50 / NDCG@50 / recall_drop / recovery_rate。`,
      icon: BarChart3,
      tone: 'text-secondary bg-secondary/10 border-secondary/20',
    },
    {
      title: '安全展示',
      description:
        readDeliveryText(report.delivery, 'securitySummary') ??
        '按 artifact 展示投毒、目标 rank 对比、Krum/security matrix 和鲁棒防御链路；unavailable 时直接标注暂无 / 不适用。',
      icon: Swords,
      tone: 'text-error bg-error/10 border-error/20',
    },
    {
      title: '当前边界',
      description: boundaryItems.slice(0, 3).join(' / '),
      icon: AlertTriangle,
      tone: 'text-on-surface bg-surface-container-high border-outline-variant/20',
    },
    {
      title: '后续扩展',
      description:
        readDeliveryText(report.delivery, 'nextSteps') ??
        '后续可扩展真实视觉 embedding、正式 DP accountant、真实安全聚合协议和更完整的多数据集 artifact 导出。',
      icon: Users,
      tone: 'text-tertiary bg-tertiary/10 border-tertiary/20',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <ShowcasePageHeader
        eyebrow="选拔赛展示链路"
        title="交付报告"
        description="汇总数据、机制、攻防、指标、限制和后续计划。"
        chips={['基于 showcase report 生成', '不把 proxy/demo 写成完整实现', '当前未正式实现 DP / HE / 安全聚合']}
        icon={FileText}
        tone="secondary"
      />

      <ShowcaseScenarioSelector bundle={bundle} isLoading={isLoading} onScenarioChange={setSelectedScenarioId} />

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary">报告摘要</p>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-on-surface-variant">
              作为选拔赛收尾页，本页基于当前 showcase report 汇总已实现能力、可展示结果、当前边界和后续扩展。
              proxy、demo、smoke 和 unavailable 字段会按 artifact 原样展示，不写成完整实现。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary/30 hover:text-primary">
              <Copy className="h-4 w-4" />
              复制摘要
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-surface transition-opacity hover:opacity-90">
              <Download className="h-4 w-4" />
              导出报告
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {label: '系统名称', value: '多模态联邦推荐安全实验平台'},
            {label: '当前展示场景', value: selectedScenario.name},
            {label: '数据集 / 模型', value: `${getDatasetLabel(report.datasetProfile)} / ${formatPlainValue(report.model ?? selectedScenario.model)}`},
            {label: '数据来源', value: bundle.dataSource === 'api' ? 'API artifact' : bundle.dataSource === 'mixed' ? 'API + fallback' : 'mock fallback'},
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-container-high p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-on-surface">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-on-surface">
          {summarizeArtifactValue(report.delivery) !== '暂无 / 不适用'
            ? summarizeArtifactValue(report.delivery)
            : '当前 report 未提供 delivery 字段，页面根据 dataset、metrics、recommendations、security/privacy 和边界字段生成摘要。'}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sectionCards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${card.tone}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-on-surface">指标摘要</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ScenarioMetricCard
            label="Baseline Recall@50"
            value={formatMetricValue(metrics?.baseline?.recall50)}
            description={`Baseline NDCG@50 ${formatMetricValue(metrics?.baseline?.ndcg50)}。`}
            tone="primary"
          />
          <ScenarioMetricCard
            label="Attack Recall@50"
            value={formatMetricValue(metrics?.attack?.recall50)}
            description={`Attack NDCG@50 ${formatMetricValue(metrics?.attack?.ndcg50)}。`}
            tone="error"
          />
          <ScenarioMetricCard
            label="Defense Recall@50"
            value={formatMetricValue(metrics?.defense?.recall50)}
            description={`Defense NDCG@50 ${formatMetricValue(metrics?.defense?.ndcg50)}。`}
            tone="tertiary"
          />
          <ScenarioMetricCard
            label="recovery_rate"
            value={formatPercentValue(metrics?.recoveryRate)}
            description="相对攻击造成的 Recall@50 缺口计算。"
            tone="secondary"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-error/20 bg-surface-container-low p-6">
          <div className="mb-5 flex items-center gap-3 text-error">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-xl font-bold">限制说明</h3>
          </div>
          <div className="space-y-3">
            {boundaryItems.map((item) => (
              <p key={item} className="rounded-xl bg-surface-container-high px-4 py-3 text-sm leading-6 text-on-surface">
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-tertiary/20 bg-surface-container-low p-6">
          <div className="mb-5 flex items-center gap-3 text-tertiary">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-xl font-bold">后续计划</h3>
          </div>
          <div className="space-y-3">
            {[
              '补齐更多场景的 title/category/image_url 和真实视觉 embedding。',
              '如需差分隐私，需要正式 privacy accountant 与参数审计。',
              '如需安全聚合，需要真实协议链路，而不是 secure_agg_sim 展示字段。',
            ].map((item) => (
              <p key={item} className="rounded-xl bg-surface-container-high px-4 py-3 text-sm leading-6 text-on-surface">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-secondary" />
          <h3 className="text-xl font-bold text-on-surface">报告使用说明</h3>
        </div>
        <p className="text-sm leading-7 text-on-surface-variant">
          本页作为评审展示入口，帮助快速理解 FedVLR 的数据融合、客户端个性化和攻防验证链路。
          “复制摘要”和“导出报告”为展示占位按钮，当前不执行复杂导出逻辑。
        </p>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">下一步</p>
            <h3 className="mt-2 text-xl font-bold text-on-surface">训练控制台 或 回到首页</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              交付总结后，可进入训练控制台查看实验配置与运行监控，也可以回到首页重新开始完整演示路线。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-surface-container-high px-4 py-2 text-sm font-bold text-primary">
              <Terminal className="h-4 w-4" />
              训练控制台
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface">
              <Home className="h-4 w-4" />
              回到首页
            </span>
            <ArrowRight className="hidden h-6 w-6 text-primary lg:block" />
          </div>
        </div>
      </section>
    </div>
  );
};
