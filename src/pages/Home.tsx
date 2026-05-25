import React from 'react';
import {motion} from 'motion/react';
import {ArrowRight, BarChart3, FileText, Radar, Swords} from 'lucide-react';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {formatMetricValue, formatPercentValue} from '../lib/showcaseFormat';
import type {PageType} from '../types/common';

interface HomeProps {
  onPageChange?: (page: PageType) => void;
}

const entrances: Array<{
  title: string;
  description: string;
  page: PageType;
  icon: React.ComponentType<{className?: string}>;
  tone: string;
}> = [
  {
    title: '进入攻防沙盘',
    description: '查看联邦拓扑飞线、投毒粒子、防御消散、target rank 推进和推荐对照。',
    page: 'attackDefenseRange',
    icon: Swords,
    tone: 'border-rose-300/30 bg-rose-300/10 text-rose-100',
  },
  {
    title: '查看实验结果',
    description: '汇总 KU / Amazon / V2.5 / 隐私风险 / 模型能力矩阵。',
    page: 'experimentResults',
    icon: BarChart3,
    tone: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  },
  {
    title: '生成交付报告',
    description: '面向评委展示已实现能力、可展示实验、边界与后续增强。',
    page: 'deliveryReport',
    icon: FileText,
    tone: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
  },
];

export const Home: React.FC<HomeProps> = ({onPageChange}) => {
  const {bundle} = useShowcaseBundle();
  const metrics = bundle.report.metricsSummary;
  const v25 = bundle.report.v25Summary;

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-700/50 bg-slate-950/70 p-6 shadow-[0_0_52px_rgba(34,211,238,0.1)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_84%_30%,rgba(244,63,94,0.12),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.82),rgba(2,6,23,0.95))]" />
        <div className="relative z-10 grid min-h-[680px] grid-cols-1 gap-7 xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)] xl:items-center">
          <div className="max-w-xl">
            <motion.div
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100"
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
            >
              <Radar className="h-3.5 w-3.5" />
              Digital Federated Sandbox
            </motion.div>
            <motion.h1
              className="text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl"
              initial={{opacity: 0, y: 18}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.08}}
            >
              联邦安全推荐数字沙盘
            </motion.h1>
            <motion.p
              className="mt-6 text-lg leading-8 text-slate-300"
              initial={{opacity: 0, y: 18}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.16}}
            >
              基于 FedVLR showcase artifacts，把多模态推荐、目标投毒、隐私风险、鲁棒防御和交付边界收束成一条评委能快速理解的演示路径。
            </motion.p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                {label: 'Recall@50', value: formatMetricValue(metrics?.baseline?.recall50 ?? metrics?.attack?.recall50)},
                {label: 'NDCG@50', value: formatMetricValue(metrics?.baseline?.ndcg50 ?? metrics?.attack?.ndcg50)},
                {label: '目标排序', value: v25?.targetRankBefore && v25?.targetRankAfter ? `${v25.targetRankBefore} -> ${v25.targetRankAfter}` : '170 -> 3'},
                {label: '最终 Top50', value: formatPercentValue(v25?.maskedTopkHitRate ?? 0)},
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-700/50 bg-slate-900/45 p-4 backdrop-blur">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onPageChange?.('attackDefenseRange')}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.24)] transition hover:scale-[1.02]"
              >
                进入攻防沙盘
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange?.('experimentResults')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/50 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-cyan-300/40 hover:text-cyan-100"
              >
                查看真实 artifact
              </button>
            </div>
          </div>

          <FederatedTopology mode="overview" defenseActive className="min-h-[560px]" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {entrances.map((entry, index) => (
          <motion.button
            key={entry.title}
            type="button"
            onClick={() => onPageChange?.(entry.page)}
            className="group rounded-[24px] border border-slate-700/50 bg-slate-900/40 p-5 text-left backdrop-blur-md transition hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_0_28px_rgba(34,211,238,0.12)]"
            initial={{opacity: 0, y: 18}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: index * 0.08}}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${entry.tone}`}>
                <entry.icon className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
            </div>
            <h3 className="text-xl font-bold text-white">{entry.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{entry.description}</p>
          </motion.button>
        ))}
      </section>
    </div>
  );
};
