import React from 'react';
import {AlertTriangle, BarChart3, BadgeCheck, Database, FileText, Layers3, Route, ShieldCheck, Target, Users} from 'lucide-react';
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
  getRecommendationCounts,
  summarizeArtifactValue,
  toChineseLabel,
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

const sourceLabel = (source: string) => {
  if (source === 'api') {
    return 'API artifact';
  }
  if (source === 'mixed') {
    return 'API + fallback';
  }
  return 'mock fallback';
};

export const DeliveryReport: React.FC = () => {
  const {bundle, isLoading, setSelectedScenarioId} = useShowcaseBundle();
  const {report, selectedScenario} = bundle;
  const metrics = report.metricsSummary;
  const recommendationCounts = getRecommendationCounts(report.recommendationComparison);
  const recommendationTotal = recommendationCounts.baseline + recommendationCounts.attack + recommendationCounts.defense;
  const boundaryItems = getBoundaryItems(report, selectedScenario);
  const v25 = report.v25Summary;
  const targetEntry = report.targetRankSummary?.entries[0];
  const targetRankBefore = v25?.targetRankBefore ?? targetEntry?.baselineRank;
  const targetRankAfter = v25?.targetRankAfter ?? targetEntry?.attackRank;
  const maskedTopkHitRate = v25?.maskedTopkHitRate ?? report.targetRankSummary?.targetHitRate ?? metrics?.targetHitRate;
  const matrixCount = report.modelCapabilityMatrix?.entries.length ?? 0;

  const implementedCapabilities = [
    {
      title: '多模态联邦推荐展示',
      description: 'KU / MMFedRAP 作为多模态主展示链路，展示文本、图像占位特征、交互数据和推荐指标摘要。',
      icon: Layers3,
    },
    {
      title: 'Amazon 商品推荐对照',
      description:
        recommendationTotal > 0
          ? `当前场景可展示 ${recommendationTotal} 条推荐项，商品图优先使用本地缓存图，失败后再使用原始图片链接或占位图。`
          : '当前场景没有完整推荐列表时，页面显示暂无数据，不补假商品或假分数。',
      icon: Database,
    },
    {
      title: '攻防与隐私风险审计',
      description: '展示投毒、目标排序、成员推断、交互候选还原、Krum / Median / TrimmedMean 等 artifact 摘要。',
      icon: ShieldCheck,
    },
    {
      title: '模型能力矩阵',
      description:
        matrixCount > 0
          ? `已读取 ${matrixCount} 条模型能力记录，用于区分已支持、部分支持、暂不支持和后续适配。`
          : '模型能力矩阵作为独立 showcase 场景读取；当前场景未提供矩阵时不强行补结论。',
      icon: BadgeCheck,
    },
  ];

  const demonstrableExperiments = [
    {
      label: 'KU 主攻防结果',
      value: `${formatMetricValue(metrics?.baseline?.recall50)} / ${formatMetricValue(metrics?.baseline?.ndcg50)}`,
      detail: '以 Recall@50 / NDCG@50 为主口径展示，不回退成单轮最大值。',
    },
    {
      label: 'Amazon target promotion V2.5',
      value:
        targetRankBefore !== null && targetRankBefore !== undefined && targetRankAfter !== null && targetRankAfter !== undefined
          ? `${formatPlainValue(targetRankBefore)} -> ${formatPlainValue(targetRankAfter)}`
          : EMPTY_VALUE,
      detail: `最终 Top50 曝光：${maskedTopkHitRate === 0 ? '未命中' : formatPercentValue(maskedTopkHitRate)}。rank 前移不等于进入 Top50。`,
    },
    {
      label: '交互候选还原',
      value: [
        `hit@10 ${formatPercentValue(v25?.interactionReconstructionHit10)}`,
        `hit@20 ${formatPercentValue(v25?.interactionReconstructionHit20)}`,
        `hit@50 ${formatPercentValue(v25?.interactionReconstructionHit50)}`,
      ].join(' / '),
      detail: '只展示 artifact 摘要，不声称完整隐私攻击覆盖所有模型。',
    },
    {
      label: '成员推断 / 安全聚合 / 差分隐私工具',
      value: `AUC ${formatMetricValue(v25?.miaAuc)} / SecAgg ${formatMetricValue(v25?.secAggResidual)}`,
      detail: `${formatPlainValue(v25?.opacusStatus ?? '暂不可用')}：${formatPlainValue(v25?.opacusBoundary ?? '正式差分隐私会计留作后续工作')}`,
    },
  ];

  const futureWork = [
    '补齐更多场景的商品 title、category、local_image_url 与真实视觉 embedding。',
    '如需差分隐私，需要正式 privacy accountant 与训练参数审计；当前只能写作差分隐私风格加噪。',
    '如需安全聚合，需要真实协议链路；当前只能写作安全聚合模拟。',
    '扩展模型适配器前，暂不支持 / 后续适配应作为能力边界呈现，不写成失败结论。',
  ];

  const usageScenarios = ['竞赛评审快速演示', '攻防链路讲解', '前后端联调验收', '后续模型适配规划'];

  return (
    <div className="space-y-8 pb-12">
      <ShowcasePageHeader
        eyebrow="评委结尾页"
        title="交付报告"
        description="从当前 showcase artifact 生成可讲解的交付摘要：已实现能力、可展示实验、当前边界、后续增强和适用场景。"
        chips={['中文化交付摘要', 'API artifact 优先', '代理证据 / 演示验证 / 快速冒烟不写成完整实现']}
        icon={FileText}
        tone="secondary"
      />

      <ShowcaseScenarioSelector bundle={bundle} isLoading={isLoading} onScenarioChange={setSelectedScenarioId} />

      <section className="sandbox-panel p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">交付摘要</p>
            <h2 className="mt-3 text-2xl font-bold text-white">基于真实 artifact 的联邦推荐攻防展示平台</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              {readDeliveryText(report.delivery, 'systemSummary') ??
                '本页面面向评审收尾，汇总数据、模型、攻防、隐私风险、鲁棒防御和边界说明。所有缺失字段显示为暂无 / 不适用，不用 mock 或展示曲线伪装完整训练过程。'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {label: '当前场景', value: selectedScenario.name},
              {label: '数据集 / 模型', value: `${getDatasetLabel(report.datasetProfile)} / ${formatPlainValue(report.model ?? selectedScenario.model)}`},
              {label: '数据来源', value: sourceLabel(bundle.dataSource)},
              {label: '场景标记', value: selectedScenario.tags?.map(toChineseLabel).join(' / ') || EMPTY_VALUE},
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-slate-200">
          {summarizeArtifactValue(report.delivery) !== EMPTY_VALUE
            ? summarizeArtifactValue(report.delivery)
            : '当前 report 未提供 delivery 字段，页面根据 dataset、metrics、recommendations、security/privacy 和边界字段生成摘要。'}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {implementedCapabilities.map((card) => (
          <div key={card.title} className="sandbox-panel p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-cyan-300/40">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="sandbox-panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-cyan-300" />
          <h3 className="text-xl font-bold text-white">可展示实验</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {demonstrableExperiments.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-700/50 bg-slate-950/50 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
              <p className="mt-3 text-2xl font-bold text-white">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ScenarioMetricCard
          label="Baseline Recall@50"
          value={formatMetricValue(metrics?.baseline?.recall50)}
          description={`Baseline NDCG@50 ${formatMetricValue(metrics?.baseline?.ndcg50)}`}
          tone="primary"
        />
        <ScenarioMetricCard
          label="Attack Recall@50"
          value={formatMetricValue(metrics?.attack?.recall50)}
          description={`Attack NDCG@50 ${formatMetricValue(metrics?.attack?.ndcg50)}`}
          tone="error"
        />
        <ScenarioMetricCard
          label="Defense Recall@50"
          value={formatMetricValue(metrics?.defense?.recall50)}
          description={`Defense NDCG@50 ${formatMetricValue(metrics?.defense?.ndcg50)}`}
          tone="tertiary"
        />
        <ScenarioMetricCard
          label={toChineseLabel('recovery_rate')}
          value={formatPercentValue(metrics?.recoveryRate)}
          description="无 defense artifact 时显示为暂无 / 不适用。"
          tone="secondary"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="sandbox-panel p-6">
          <div className="mb-5 flex items-center gap-3 text-rose-300">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-xl font-bold">当前边界</h3>
          </div>
          <div className="space-y-3">
            {boundaryItems.map((item) => (
              <p key={item} className="rounded-xl border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200">
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="sandbox-panel p-6">
          <div className="mb-5 flex items-center gap-3 text-emerald-300">
            <Route className="h-5 w-5" />
            <h3 className="text-xl font-bold">后续增强</h3>
          </div>
          <div className="space-y-3">
            {futureWork.map((item) => (
              <p key={item} className="rounded-xl border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="sandbox-panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <Target className="h-5 w-5 text-cyan-300" />
          <h3 className="text-xl font-bold text-white">适用场景</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {usageScenarios.map((item) => (
            <div key={item} className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100">
              {item}
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-400">
          {readDeliveryText(report.delivery, 'nextSteps') ??
            '结论页只归纳已经可展示的 artifact，不把 secure aggregation demo 写成生产级协议，也不把 Opacus unavailable 写成 formal DP 已实现。'}
        </p>
      </section>

      <section className="sandbox-panel p-6">
        <div className="mb-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-emerald-300" />
          <h3 className="text-xl font-bold text-white">讲解口径</h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            'FedAvg + Amazon 是攻防强验证底座，用于讲清 target promotion、隐私风险和推荐对照。',
            'MMFedRAP + KU 是多模态主展示模型，用于讲清文本、图像占位特征和客户端个性化推荐链路。',
            'FedAvg Amazon 的 target rank 170 -> 3 不能泛化到所有模型；masked Top50 hit 为 0 时不能写成攻击成功。',
          ].map((item) => (
            <div key={item} className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 text-sm leading-6 text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
