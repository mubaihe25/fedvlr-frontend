import React from 'react';
import {motion} from 'motion/react';
import {ArrowRight, Blocks, BarChart3, ShieldCheck, Swords} from 'lucide-react';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import type {PageType} from '../types/common';

interface HomeProps {
  onPageChange?: (page: PageType) => void;
}

const steps = [
  {title: '用户数据本地保留', text: '图片、文本和交互记录在客户端侧参与训练。'},
  {title: '服务端聚合推荐模型', text: '服务端只接收模型更新，不接收原始用户行为。'},
  {title: '攻击与防御验证', text: '用隐私攻击、目标投毒和鲁棒防御解释安全边界。'},
];

const actionButtons: Array<{label: string; page: PageType; icon: React.ComponentType<{className?: string}>; primary?: boolean}> = [
  {label: '了解系统机制', page: 'systemMechanism', icon: Blocks, primary: true},
  {label: '进入攻防工作台', page: 'attackDefenseRange', icon: Swords},
  {label: '查看实验档案', page: 'history', icon: BarChart3},
];

export const Home: React.FC<HomeProps> = ({onPageChange}) => (
  <div className="pb-10">
    <section className="sandbox-panel sandbox-glow relative overflow-hidden rounded-[32px] p-6 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_74%_82%,rgba(16,185,129,0.1),transparent_28%)]" />
      <div className="relative z-10 grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-7 xl:grid-cols-[0.68fr_1.32fr] xl:items-center">
        <div className="max-w-2xl">
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-bold text-cyan-100"
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            安全推荐系统演示平台
          </motion.div>
          <motion.h1
            className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl"
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.08}}
          >
            面向多模态推荐的联邦隐私攻防一体化靶场系统
          </motion.h1>
          <motion.p
            className="mt-5 text-base leading-8 text-slate-300 md:text-lg"
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.16}}
          >
            一个可交互的数字沙盘，把推荐系统训练、恶意更新、隐私风险和防御恢复放在同一条演示链路里。
          </motion.p>

          <div className="mt-8 space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-2xl border border-white/8 bg-white/[0.045] p-3"
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
