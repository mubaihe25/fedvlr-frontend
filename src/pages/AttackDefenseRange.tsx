import React from 'react';
import {ArrowRight, BarChart3, Info, Network, ShieldCheck, Swords, Users} from 'lucide-react';
import {DefenseTraceCard} from '../components/showcase/DefenseTraceCard';
import {RecommendationList} from '../components/showcase/RecommendationList';
import {ScenarioMetricCard} from '../components/showcase/ScenarioMetricCard';
import {ShowcasePageHeader} from '../components/showcase/ShowcasePageHeader';
import {attackDefenseCases, showcaseSampleNotice} from '../mock/showcase';

const formatMetric = (value: number) => value.toFixed(4);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

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
    title: '投毒攻击注入',
    description: '异常更新推动目标物品进入推荐候选前列。',
    icon: Swords,
    tone: 'border-error/20 bg-error/10 text-error',
  },
  {
    title: '鲁棒防御处理',
    description: '裁剪、过滤和截尾聚合削弱异常方向。',
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
    description: '正常兴趣物品回升，异常物品被压制。',
    icon: BarChart3,
    tone: 'border-tertiary/20 bg-tertiary/10 text-tertiary',
  },
];

export const AttackDefenseRange: React.FC = () => {
  const caseData = attackDefenseCases[0];
  const recommendations = caseData.recommendationComparison;

  return (
    <div className="space-y-8 pb-12">
      <ShowcasePageHeader
        eyebrow="选拔赛展示链路"
        title="攻防靶场"
        description="展示投毒攻击造成的推荐偏移，以及鲁棒防御带来的恢复效果。"
        chips={['投毒攻击 → 异常更新影响聚合', '鲁棒防御处理 → 推荐效果恢复', 'Recall@50 / NDCG@50 / 攻击降幅 / 防御恢复率']}
        icon={Swords}
        tone="error"
      />

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="mb-2 font-mono text-xs font-bold text-primary">{caseData.caseId}</p>
            <h3 className="text-2xl font-bold text-on-surface">{caseData.title}</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-on-surface-variant">{caseData.note} {showcaseSampleNotice}</p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            showcase 示例
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            {label: '数据集', value: caseData.dataset},
            {label: '客户端', value: caseData.clientId},
            {label: '攻击方式', value: caseData.attackType},
            {label: '防御方式', value: caseData.defenseType},
            {label: '恶意客户端比例', value: formatPercent(caseData.maliciousRatio)},
            {label: '聚合规则', value: caseData.defenseTrace.aggregationRule},
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-container-high p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              <p className="mt-2 break-words text-sm font-semibold text-on-surface">{item.value}</p>
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RecommendationList
          title="基线推荐"
          description="正常联邦训练下的 Top-K 推荐，体现客户端原始兴趣。"
          items={recommendations.baselineRecommendations}
          tone="baseline"
        />
        <RecommendationList
          title="投毒攻击后"
          description="异常更新注入后，目标物品进入前列，正常推荐被挤压。"
          items={recommendations.attackedRecommendations}
          tone="attack"
        />
        <RecommendationList
          title="鲁棒防御后"
          description="鲁棒处理削弱异常更新后，正常推荐部分恢复，异常物品回落。"
          items={recommendations.defendedRecommendations}
          tone="defense"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ScenarioMetricCard
          label="Baseline Recall@50"
          value={formatMetric(caseData.baselineMetrics.recall50)}
          description="基线推荐效果，用作攻防对照起点。"
          tone="primary"
        />
        <ScenarioMetricCard
          label="Attack Recall@50"
          value={formatMetric(caseData.attackMetrics.recall50)}
          description="投毒后推荐效果下降。"
          tone="error"
        />
        <ScenarioMetricCard
          label="Defense Recall@50"
          value={formatMetric(caseData.defenseMetrics.recall50)}
          description="鲁棒防御后部分恢复。"
          tone="tertiary"
        />
        <ScenarioMetricCard
          label="攻击降幅"
          value={formatPercent(caseData.attackImpact.recallDrop)}
          description={`NDCG@50 降幅 ${formatPercent(caseData.attackImpact.ndcgDrop)}。`}
          tone="error"
        />
        <ScenarioMetricCard
          label="防御恢复率"
          value={formatPercent(caseData.recoveryRate)}
          description="相对攻击造成的 Recall@50 缺口计算。"
          tone="tertiary"
        />
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-5 flex items-start gap-3">
          <Info className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-on-surface">推荐列表变化说明</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              投毒攻击不仅导致 Recall@50 / NDCG@50 下降，也会把异常推广物品推入 Top-K，
              同时使正常兴趣物品排名下降。鲁棒防御通过削弱异常更新影响，让正常推荐部分恢复并压低异常物品排名。
            </p>
          </div>
        </div>
      </section>

      <DefenseTraceCard trace={caseData.defenseTrace} />

      <section className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">下一步</p>
            <h3 className="mt-2 text-xl font-bold text-on-surface">实验结果</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              继续查看基线、攻击和防御三组指标摘要，并进入单次结果、历史实验与横向对比。
            </p>
          </div>
          <ArrowRight className="h-6 w-6 text-primary" />
        </div>
      </section>
    </div>
  );
};
