import React from 'react';
import {motion} from 'motion/react';
import {
  ArrowRight,
  Cloud,
  Microscope,
  Network,
  Plus,
  Shield,
  ShieldCheck,
  Swords,
  TrendingUp,
} from 'lucide-react';
import {mockHomeData} from '../mock/home';
import type {PageType} from '../types/common';

interface HomeProps {
  onPageChange?: (page: PageType) => void;
}

const toneClasses = {
  primary: {
    badge: 'bg-primary/10 text-primary',
    border: 'hover:border-primary/30',
    ring: 'border-primary/20',
  },
  secondary: {
    badge: 'bg-secondary/10 text-secondary',
    border: 'hover:border-secondary/30',
    ring: 'border-secondary/20',
  },
  tertiary: {
    badge: 'bg-tertiary/10 text-tertiary',
    border: 'hover:border-tertiary/30',
    ring: 'border-tertiary/20',
  },
  error: {
    badge: 'bg-error/10 text-error',
    border: 'hover:border-error/30',
    ring: 'border-error/20',
  },
  success: {
    badge: 'bg-success/10 text-success',
    border: 'hover:border-success/30',
    ring: 'border-success/20',
  },
} as const;

const overviewIcons = [Network, Cloud, Microscope, Swords, TrendingUp] as const;

const mechanismIcons = {
  primary: Network,
  secondary: Cloud,
  tertiary: Microscope,
  error: ShieldCheck,
} as const;

export const Home: React.FC<HomeProps> = ({onPageChange}) => {
  const {hero, overview, mechanisms, fusionRationale, snapshotMetrics, snapshotChart, capabilities} = mockHomeData;

  return (
    <div className="relative space-y-24 pb-12">
      <section className="relative min-h-[600px] overflow-hidden rounded-3xl px-6 py-20 text-center">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img
            className="h-full w-full object-cover"
            alt="federated recommendation security background"
            src={hero.backgroundImage}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-surface" />

        <div className="relative z-10 mx-auto mt-12 flex max-w-4xl flex-col items-center">
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="kinetic-glow mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {hero.badge}
          </motion.div>
          <motion.h1
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.1}}
            className="mb-6 bg-gradient-to-br from-white via-primary to-secondary bg-clip-text text-5xl font-bold leading-[1.1] tracking-tight text-transparent md:text-7xl"
          >
            {hero.title}
          </motion.h1>
          <motion.p
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.2}}
            className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-on-surface-variant"
          >
            {hero.subtitle}
          </motion.p>
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.3}}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button
              onClick={() => onPageChange?.('console')}
              className="rounded-lg bg-gradient-to-r from-primary to-secondary px-8 py-4 font-bold text-surface shadow-[0_8px_32px_rgba(129,236,255,0.25)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(129,236,255,0.4)] active:scale-95"
            >
              {hero.primaryAction}
            </button>
            <button
              onClick={() => onPageChange?.('architecture')}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-highest/50 px-8 py-4 font-bold text-on-surface transition-all hover:bg-surface-container-highest active:scale-95"
            >
              {hero.secondaryAction}
            </button>
          </motion.div>
        </div>
      </section>

      <section className="w-full">
        <div className="mb-16 max-w-5xl">
          <h2 className="mb-4 text-3xl font-bold">{overview.title}</h2>
          <div className="mb-6 h-1 w-16 bg-primary" />
          <p className="text-lg leading-relaxed text-on-surface-variant">{overview.description}</p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-12 right-12 top-16 hidden h-px bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 xl:block" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
            {overview.nodes.map((node, index) => {
              const tone = toneClasses[node.tone];
              const Icon = overviewIcons[index] ?? TrendingUp;

              return (
                <div key={node.title} className="relative">
                  <div
                    className={`group relative z-10 h-full rounded-3xl border border-outline-variant/10 bg-surface-container-low p-6 transition-all duration-500 ${tone.border}`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone.badge}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant/60">
                        0{index + 1}
                      </div>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-on-surface">{node.title}</h3>
                    <p className="mb-3 text-sm font-medium text-primary">{node.subtitle}</p>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{node.detail}</p>
                  </div>
                  {index < overview.nodes.length - 1 ? (
                    <div className="hidden xl:flex absolute -right-4 top-12 z-20 h-8 w-8 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-highest text-outline-variant">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="mb-10 flex flex-col items-start">
          <h2 className="mb-4 text-3xl font-bold">核心机制能力</h2>
          <div className="h-1 w-16 bg-primary" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {mechanisms.map((mechanism) => {
            const tone = toneClasses[mechanism.tone];
            const Icon = mechanismIcons[mechanism.tone];

            return (
              <div
                key={mechanism.title}
                className={`group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-all duration-500 ${tone.border}`}
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${tone.badge} transition-transform group-hover:scale-110`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-on-surface">{mechanism.title}</h3>
                <p className="leading-relaxed text-on-surface-variant">{mechanism.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
          <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 md:p-10">
            <div className="mb-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              双层融合机制
            </div>
            <h2 className="mb-4 text-3xl font-bold">{fusionRationale.title}</h2>
            <p className="text-lg leading-relaxed text-on-surface-variant">{fusionRationale.description}</p>
          </div>

          <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-6 md:p-8">
            <div className="space-y-4">
              {fusionRationale.personas.map((persona, index) => {
                const tone = toneClasses[persona.tone];

                return (
                  <div
                    key={persona.title}
                    className={`flex items-center gap-4 rounded-2xl border ${tone.ring} bg-surface-container-high p-4`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.badge}`}>
                      <span className="text-sm font-bold">{index < 3 ? index + 1 : 4}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">{persona.title}</div>
                      <div className="text-sm text-on-surface-variant">{persona.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h2 className="mb-4 text-3xl font-bold">实验闭环输出</h2>
            <p className="text-on-surface-variant">
              平台支持基线、攻击与攻防对比三类实验结果的统一展示，可直观观察模型在正常训练、恶意更新注入与鲁棒恢复过程中的性能变化。
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {capabilities.map((capability) => (
              <div key={capability.label} className="rounded-lg bg-surface-container-high px-4 py-2">
                <span className="text-on-surface-variant">{capability.label}：</span>
                <span className="text-on-surface">{capability.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {snapshotMetrics.map((metric) => (
            <div
              key={metric.key}
              className="flex flex-col justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8"
            >
              <div className="mb-4 text-sm font-medium uppercase tracking-widest text-on-surface-variant">{metric.title}</div>
              <div className="text-4xl font-bold text-primary">{metric.value}</div>
              <div className="mt-4 flex items-center gap-2 text-xs text-tertiary">
                <TrendingUp className="h-4 w-4" />
                <span>{metric.trend}</span>
              </div>
            </div>
          ))}

          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8 lg:col-span-2">
            <div className="mb-4 flex flex-1 items-end justify-around gap-4">
              {snapshotChart.map((point, index) => {
                const toneClass =
                  index === 0 ? 'bg-outline-variant/20' : index === 1 ? 'bg-error/45' : 'bg-tertiary/65';
                const labelClass =
                  index === 0 ? 'text-on-surface-variant' : index === 1 ? 'text-error' : 'text-tertiary';

                return (
                  <div key={point.label} className="flex h-full flex-1 flex-col items-center justify-end">
                    <div
                      className={`w-full max-w-[88px] rounded-t-lg transition-all ${toneClass}`}
                      style={{height: `${point.value}%`}}
                    />
                    <div className={`mt-3 text-xs font-medium ${labelClass}`}>{point.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs italic text-on-surface-variant">
              基线、投毒与攻防对比场景下的代表性性能变化
            </div>
          </div>
        </div>
      </section>

      <footer className="-mx-8 mt-auto border-t border-outline-variant/20 bg-surface-container-low/50 px-8 py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-lg font-bold">联邦推荐安全实验平台</span>
              <p className="text-xs text-on-surface-variant">平台演示页面</p>
            </div>
          </div>
          <div className="flex gap-8 text-sm text-on-surface-variant">
            <span>联邦训练流程展示</span>
            <span>结果分析与对比</span>
          </div>
        </div>
      </footer>

      <button className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-surface shadow-[0_0_20px_rgba(129,236,255,0.4)] transition-all hover:scale-110 active:scale-95">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};
