import React from 'react';
import { motion } from 'motion/react';
import { Activity, ArrowRight, Code, Cpu, Database, Lock, Shield, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const summaryCards = [
  {
    title: '平台定位',
    description:
      '该平台面向联邦推荐安全实验场景，支持实验配置、训练过程监控、结果分析与历史实验管理，强调展示与控制一体化的实验平台能力。',
    icon: Shield,
    accent: 'text-tertiary',
  },
  {
    title: '架构目标',
    description:
      '平台采用分层结构，将页面展示、任务调度、训练执行与结果分析进行解耦，为后续接入真实训练后端与攻防模块提供清晰的结构基础。',
    icon: Lock,
    accent: 'text-secondary',
  },
];

const architectureLayers = [
  {
    title: '前端展示层',
    description:
      '负责项目总览、实验配置、运行监控、结果分析、对比分析与历史实验展示，为评审提供可视化交互入口。',
    icon: Activity,
    accent: 'from-primary/15 to-primary/5',
    iconTone: 'text-primary',
  },
  {
    title: '接口调度层',
    description:
      '负责训练任务创建、状态查询、结果返回与历史实验管理，是前端页面与训练核心之间的任务调度桥梁。',
    icon: Database,
    accent: 'from-secondary/15 to-secondary/5',
    iconTone: 'text-secondary',
  },
  {
    title: '训练核心层',
    description:
      '负责联邦训练主流程执行，并承载攻击模拟、防御处理与性能评估，是实验任务的核心计算部分。',
    icon: Cpu,
    accent: 'from-tertiary/15 to-tertiary/5',
    iconTone: 'text-tertiary',
  },
];

const flowSteps = [
  {
    title: '步骤 1：配置实验参数',
    description:
      '在训练控制台中选择数据集、模型、实验模式及攻防参数，形成当前实验配置。',
    icon: Code,
    className: 'col-span-12 lg:col-span-7 bg-surface-container-low',
    iconTone: 'text-primary',
  },
  {
    title: '步骤 2：创建训练任务',
    description:
      '前端根据当前配置发起训练任务，请求进入任务执行流程，并记录当前任务状态。',
    icon: ArrowRight,
    className: 'col-span-12 sm:col-span-6 lg:col-span-5 bg-surface-container-high',
    iconTone: 'text-secondary',
  },
  {
    title: '步骤 3：联邦训练执行',
    description:
      '训练核心完成客户端采样、本地训练、参数上传与服务器聚合，并在必要阶段进行评估。',
    icon: Cpu,
    className: 'col-span-12 sm:col-span-6 lg:col-span-5 bg-surface-container-high',
    iconTone: 'text-tertiary',
  },
  {
    title: '步骤 4：输出分析结果',
    description:
      '平台统一组织实验指标、曲线、对比结果与历史记录，支撑结果分析与实验复用。',
    icon: Activity,
    className: 'col-span-12 lg:col-span-7 bg-[#0c141b] border border-primary/20',
    iconTone: 'text-primary',
  },
];

const attackTags = ['基线实验', '攻击实验', '攻防对比实验', '攻击模块', '防御模块', '聚合处理', '性能评估'];

const pageMappings = [
  '首页：项目总览与流程展示',
  '训练控制台：实验配置与过程控制',
  '结果分析：单次实验结果查看',
  '对比分析：多实验横向比较',
  '历史实验：结果管理与配置复用',
];

const capabilityCards = [
  {
    eyebrow: '前端展示能力',
    title: '统一展示实验流程',
    description: '支持实验配置、状态监控、结果分析与多组对比的统一展示。',
    accent: 'text-primary',
  },
  {
    eyebrow: '结果组织能力',
    title: '形成结构化输出',
    description: '支持单次结果查看、历史实验管理、对比分析与关键指标可视化。',
    accent: 'text-tertiary',
  },
];

export const Architecture: React.FC = () => {
  return (
    <div className="space-y-24 pb-24">
      <section className="relative pt-12">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 font-headline text-5xl font-bold tracking-tight text-on-surface"
          >
            系统<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">架构</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-4 text-xl font-light leading-relaxed text-on-surface-variant"
          >
            展示平台整体组成、联邦训练流程、攻防插入位置以及结果分析能力。
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="max-w-3xl text-sm leading-7 text-on-surface-variant"
          >
            本平台围绕联邦推荐安全实验构建，前端负责实验展示、配置、监控与结果分析，接口层负责任务调度与状态传递，训练核心负责任务执行、攻击模拟与防御处理。本页从系统组成、训练流程、攻防位置以及结果输出四个角度，对整体结构进行说明。
          </motion.p>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {summaryCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8"
              >
                <div className="mb-4 flex items-center gap-4">
                  <card.icon className={cn('h-6 w-6', card.accent)} />
                  <h3 className="font-headline text-xl text-on-surface">{card.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-on-surface-variant">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface">系统总体架构</h2>
            <p className="mt-2 text-on-surface-variant">以前端展示、接口调度与训练核心三层组织实验平台能力。</p>
          </div>
          <div className="mx-12 mb-2 hidden h-[2px] flex-1 bg-gradient-to-r from-primary/20 to-transparent md:block" />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {architectureLayers.map((layer, index) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 transition-all duration-500 hover:bg-surface-container-high"
            >
              <div className={cn('absolute inset-x-0 top-0 h-32 bg-gradient-to-br opacity-80 transition-all', layer.accent)} />
              <div className="relative z-10">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-high">
                  <layer.icon className={cn('h-7 w-7', layer.iconTone)} />
                </div>
                <h4 className="mb-4 text-xl font-bold text-on-surface">{layer.title}</h4>
                <div className="mb-4 h-px w-full bg-outline-variant/20" />
                <p className="text-sm leading-relaxed text-on-surface-variant">{layer.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-10">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">联邦训练流程</h2>
          <p className="mt-2 text-on-surface-variant">从参数配置到结果沉淀，页面与训练任务按照统一链路协同工作。</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {flowSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={cn(
                'group relative overflow-hidden rounded-3xl p-8',
                step.className,
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface/40">
                    <step.icon className={cn('h-6 w-6', step.iconTone)} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">
                    Flow {index + 1}
                  </span>
                </div>
                <h3 className="mb-3 font-headline text-2xl font-bold text-on-surface">{step.title}</h3>
                <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <div className="rounded-[2rem] border border-primary/20 bg-[#0c141b] p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-headline text-3xl font-bold text-on-surface">攻防模块插入点</h2>
              <p className="mt-1 text-sm text-on-surface-variant">围绕关键训练环节预留攻击模拟与防御恢复的位置。</p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-4">
            {attackTags.map((tag, index) => (
              <div
                key={tag}
                className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-highest px-4 py-2 text-xs font-medium text-on-surface"
              >
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    index % 3 === 0 ? 'bg-primary' : index % 3 === 1 ? 'bg-secondary' : 'bg-tertiary',
                  )}
                />
                {tag}
              </div>
            ))}
          </div>

          <p className="max-w-5xl text-sm leading-7 text-on-surface-variant">
            平台在联邦训练关键环节中预留攻击与防御模块位置。攻击模块用于模拟恶意客户端引发的异常更新行为，防御模块用于在聚合或更新处理阶段降低异常更新的影响，从而构建“正常训练—攻击退化—防御恢复”的可对比实验链路。
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-12 xl:flex-row xl:items-start">
        <div className="relative flex-1 rounded-[2rem] border border-outline-variant/20 bg-gradient-to-br from-surface-container-low to-surface-container-high p-12">
          <ArrowRight className="absolute right-8 top-8 h-16 w-16 text-primary/10" />
          <h2 className="mb-6 font-headline text-2xl font-bold text-on-surface">页面与功能对应关系</h2>
          <p className="mb-8 max-w-4xl text-sm leading-7 text-on-surface-variant">
            平台前端并非简单的信息展示页面集合，而是与实验流程和系统能力相对应的可视化操作界面。首页负责项目总览、流程概览与代表性结果展示；训练控制台负责实验配置、任务监控、结果分析、对比分析与历史实验管理；系统架构页负责整体结构说明与模块关系展示。通过页面与功能的一一对应，平台形成从实验发起到结果分析的完整闭环。
          </p>
          <div className="grid gap-3 text-sm text-on-surface">
            {pageMappings.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-outline-variant/10 bg-surface/30 px-4 py-3 text-on-surface-variant"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-4 xl:w-1/3">
          {capabilityCards.map((card) => (
            <div key={card.eyebrow} className="rounded-2xl bg-surface-container-low p-6">
              <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-widest', card.accent)}>{card.eyebrow}</p>
              <p className="text-xl font-headline font-bold text-on-surface">{card.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-outline-variant/10 pt-12 text-xs text-on-surface-variant/60">
        <p>联邦推荐安全实验平台</p>
        <p>平台演示页面</p>
      </footer>
    </div>
  );
};
