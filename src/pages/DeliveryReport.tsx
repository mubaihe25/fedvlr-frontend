import React from 'react';
import {AlertTriangle, BarChart3, Copy, Database, Download, FileText, Layers, ShieldCheck, Swords, Users} from 'lucide-react';
import {ScenarioMetricCard} from '../components/showcase/ScenarioMetricCard';
import {attackDefenseCases, datasetProfile, deliverySummary} from '../mock/showcase';

const formatMetric = (value: number) => value.toFixed(4);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const sectionCards = [
  {
    title: '数据与融合摘要',
    description: deliverySummary.dataSummary,
    icon: Database,
    tone: 'text-primary bg-primary/10 border-primary/20',
  },
  {
    title: '客户端个性化摘要',
    description: deliverySummary.modelSummary,
    icon: Users,
    tone: 'text-tertiary bg-tertiary/10 border-tertiary/20',
  },
  {
    title: '攻防实验摘要',
    description: deliverySummary.securitySummary,
    icon: Swords,
    tone: 'text-error bg-error/10 border-error/20',
  },
  {
    title: '指标结果摘要',
    description: deliverySummary.metricsSummary,
    icon: BarChart3,
    tone: 'text-secondary bg-secondary/10 border-secondary/20',
  },
  {
    title: '限制与后续计划',
    description: '明确当前展示边界，并给出后续 artifacts 接入方向。',
    icon: AlertTriangle,
    tone: 'text-on-surface bg-surface-container-high border-outline-variant/20',
  },
];

export const DeliveryReport: React.FC = () => {
  const caseData = attackDefenseCases[0];

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
          <Layers className="h-3.5 w-3.5" />
          选拔赛交付视角
        </div>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">交付报告</h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-on-surface-variant">
              汇总系统能力、六层架构、机制解释、核心指标、攻防结果、限制说明和后续计划。当前为 showcase 总结页，
              后续可接入真实 FedVLR 导出的 artifacts。
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
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {label: '系统名称', value: 'FedVLR Showcase 展示平台'},
            {label: '当前展示场景', value: '多模态联邦推荐攻防验证链路'},
            {label: '数据集 / 客户端', value: `${datasetProfile.name} / ${caseData.clientId}`},
            {label: '生成时间', value: 'Showcase snapshot / 2026-05'},
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-container-high p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-on-surface">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-on-surface">
          {deliverySummary.systemSummary}
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
            value={formatMetric(caseData.baselineMetrics.recall50)}
            description={`Baseline NDCG@50 ${formatMetric(caseData.baselineMetrics.ndcg50)}。`}
            tone="primary"
          />
          <ScenarioMetricCard
            label="Attack Recall@50"
            value={formatMetric(caseData.attackMetrics.recall50)}
            description={`Attack NDCG@50 ${formatMetric(caseData.attackMetrics.ndcg50)}。`}
            tone="error"
          />
          <ScenarioMetricCard
            label="Defense Recall@50"
            value={formatMetric(caseData.defenseMetrics.recall50)}
            description={`Defense NDCG@50 ${formatMetric(caseData.defenseMetrics.ndcg50)}。`}
            tone="tertiary"
          />
          <ScenarioMetricCard
            label="Recovery Rate"
            value={formatPercent(caseData.recoveryRate)}
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
            {deliverySummary.limitations.map((item) => (
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
            {deliverySummary.nextSteps.map((item) => (
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
    </div>
  );
};
