import React from 'react';
import {AlertTriangle, BarChart3, Database, FileText, Layers, Swords} from 'lucide-react';

const reportCards = [
  {
    title: '系统能力摘要',
    description: '概览首页、架构、训练控制台、实验结果与交付报告的展示闭环。',
    icon: FileText,
  },
  {
    title: '数据与融合摘要',
    description: '汇总数据样本、多模态 embedding 与服务端融合视图 G1-G4。',
    icon: Database,
  },
  {
    title: '攻防实验摘要',
    description: '汇总基线、投毒攻击与鲁棒防御的推荐变化展示。',
    icon: Swords,
  },
  {
    title: '指标结果摘要',
    description: '预留 Recall@50、NDCG@50、攻击降幅与防御恢复率等核心指标。',
    icon: BarChart3,
  },
  {
    title: '限制与后续计划',
    description: '明确当前展示边界、未接入能力和下一阶段 showcase artifact 接入计划。',
    icon: AlertTriangle,
  },
];

export const DeliveryReport: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
          <Layers className="h-3.5 w-3.5" />
          选拔赛交付视角
        </div>
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">交付报告</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-on-surface-variant">
          汇总系统能力、六层架构、机制解释、核心指标、攻防结果、限制说明和后续计划。当前页面为静态报告骨架，
          后续可接入真实实验 artifact 与导出能力。
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {reportCards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/10 text-secondary">
              <card.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h3 className="mb-5 text-xl font-bold text-on-surface">报告结构占位</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {['六层架构说明', '机制解释', '核心指标表', '攻防结果摘要', '限制说明', '后续计划'].map((item) => (
            <div key={item} className="rounded-xl bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
