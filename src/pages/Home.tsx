import React from 'react';
import {motion} from 'motion/react';
import {ArrowRight, Blocks, BarChart3, ShieldCheck, Swords} from 'lucide-react';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import type {PageType} from '../types/common';

interface HomeProps {
  onPageChange?: (page: PageType) => void;
}

const steps = [
  {title: '用户数据本地保留', text: '图片、文本、交互记录在客户端侧处理。'},
  {title: '服务端聚合推荐模型', text: '服务器只聚合模型更新，不接收原始用户数据。'},
  {title: '攻击与防御验证', text: '用投毒、隐私攻击和鲁棒防御验证安全边界。'},
];

const actionButtons: Array<{label: string; page: PageType; icon: React.ComponentType<{className?: string}>; primary?: boolean}> = [
  {label: '了解系统机制', page: 'systemMechanism', icon: Blocks, primary: true},
  {label: '进入攻防实验', page: 'attackDefenseRange', icon: Swords},
  {label: '查看结果证据', page: 'resultsEvidence', icon: BarChart3},
];

export const Home: React.FC<HomeProps> = ({onPageChange}) => (
  <div className="space-y-6 pb-10">
    <section className="sandbox-panel sandbox-glow relative overflow-hidden rounded-[32px] p-7 lg:p-9">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(168,85,247,0.13),transparent_30%)]" />
      <div className="relative z-10 grid min-h-[620px] grid-cols-1 gap-8 xl:grid-cols-[0.72fr_1.28fr] xl:items-center">
        <div className="max-w-2xl">
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-bold text-cyan-100"
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            项目导览
          </motion.div>
          <motion.h1
            className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl"
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.08}}
          >
            基于联邦学习的隐私安全推荐系统及攻防验证平台
          </motion.h1>
          <motion.p
            className="mt-5 text-base leading-8 text-slate-300 md:text-lg"
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.16}}
          >
            用一个可交互的数字沙盘，把“推荐系统如何训练、攻击如何影响推荐、防御如何过滤风险、证据边界在哪里”按评审顺序讲清楚。
          </motion.p>

          <div className="mt-8 space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-2xl bg-white/[0.055] p-3"
                initial={{opacity: 0, x: -14}}
                animate={{opacity: 1, x: 0}}
                transition={{delay: 0.22 + index * 0.08}}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-200/12 text-sm font-bold text-cyan-100">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-bold text-slate-50">{step.title}</span>
                  <span className="mt-0.5 block text-sm text-slate-400">{step.text}</span>
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {actionButtons.map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={() => onPageChange?.(button.page)}
                className={
                  button.primary
                    ? 'inline-flex items-center gap-2 rounded-2xl bg-cyan-200 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_14px_34px_rgba(56,189,248,0.22)] transition hover:scale-[1.02]'
                    : 'inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-cyan-200/30 hover:text-cyan-100'
                }
              >
                <button.icon className="h-4 w-4" />
                {button.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <FederatedTopology mode="overview" defenseActive className="min-h-[520px]" />
      </div>
    </section>
  </div>
);
