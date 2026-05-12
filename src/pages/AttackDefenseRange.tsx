import React from 'react';
import {AlertTriangle, BarChart3, Info, ShieldCheck, Swords} from 'lucide-react';

const scenarioCards = [
  {
    title: '基线推荐',
    description: '正常联邦训练下的推荐结果占位，用于作为攻防对照基准。',
    icon: BarChart3,
    tone: 'border-primary/20 bg-primary/10 text-primary',
    items: ['Item-A12', 'Item-B08', 'Item-C31'],
  },
  {
    title: '投毒后推荐',
    description: '恶意客户端更新注入后的推荐变化占位，用于展示性能退化。',
    icon: Swords,
    tone: 'border-error/20 bg-error/10 text-error',
    items: ['Item-X90', 'Item-B08', 'Item-Z44'],
  },
  {
    title: '防御后推荐',
    description: '鲁棒防御处理后的推荐恢复占位，用于展示恢复趋势。',
    icon: ShieldCheck,
    tone: 'border-tertiary/20 bg-tertiary/10 text-tertiary',
    items: ['Item-A12', 'Item-C31', 'Item-D25'],
  },
];

const metricCards = [
  {label: 'Recall@50', value: '占位', tone: 'text-primary'},
  {label: 'NDCG@50', value: '占位', tone: 'text-secondary'},
  {label: '攻击降幅', value: '占位', tone: 'text-error'},
  {label: '防御恢复率', value: '占位', tone: 'text-tertiary'},
];

export const AttackDefenseRange: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-error/20 bg-error/10 px-3 py-1 text-xs font-bold text-error">
          <Swords className="h-3.5 w-3.5" />
          攻防场景对照
        </div>
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">攻防靶场</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-on-surface-variant">
          展示基线、投毒攻击、鲁棒防御三类场景下的推荐变化。当前只提供展示骨架，不改变训练链路和 API 协议。
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {scenarioCards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${card.tone}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{card.description}</p>
            <div className="mt-5 space-y-2">
              {card.items.map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-xl bg-surface-container-high px-4 py-3">
                  <span className="font-mono text-xs text-on-surface-variant">Top {index + 1}</span>
                  <span className="text-sm font-semibold text-on-surface">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {metricCards.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{metric.label}</p>
            <p className={`mt-3 text-2xl font-bold ${metric.tone}`}>{metric.value}</p>
          </div>
        ))}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 px-5 py-4 text-sm text-on-surface">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
        <p>本页不把差分隐私、安全聚合描述为当前已实现能力；相关内容仅可作为后续计划或限制说明出现。</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-on-surface">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>当前为攻防展示结构占位，后续接入真实 baseline / attack / defense showcase artifacts。</p>
      </div>
    </div>
  );
};
