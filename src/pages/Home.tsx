import React from 'react';
import {motion} from 'motion/react';
import {
  ArrowRight,
  Cloud,
  Microscope,
  MonitorSmartphone,
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

const highlightToneClasses = {
  primary: {
    badge: 'bg-primary/10 text-primary',
    border: 'hover:border-primary/30',
  },
  error: {
    badge: 'bg-error/10 text-error',
    border: 'hover:border-error/30',
  },
  tertiary: {
    badge: 'bg-tertiary/10 text-tertiary',
    border: 'hover:border-tertiary/30',
  },
} as const;

export const Home: React.FC<HomeProps> = ({onPageChange}) => {
  const {hero, flow, highlights, snapshotMetrics, snapshotChart, capabilities} = mockHomeData;

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
        <div className="mb-16 flex flex-col items-start">
          <h2 className="mb-4 text-3xl font-bold">系统流程可视化</h2>
          <div className="h-1 w-16 bg-primary" />
        </div>
        <div className="relative grid grid-cols-1 items-center gap-4 lg:grid-cols-5">
          <div className="space-y-4">
            {flow.clients.map((client, index) => (
              <div
                key={client.title}
                className={`rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 text-center ${
                  index === flow.clients.length - 1 ? 'opacity-60' : ''
                }`}
              >
                <MonitorSmartphone className="mx-auto mb-2 h-10 w-10 text-primary" />
                <div className="text-sm font-bold">{client.title}</div>
                <div className="mt-1 text-xs text-on-surface-variant">{client.subtitle}</div>
              </div>
            ))}
          </div>

          <div className="hidden justify-center lg:flex">
            <ArrowRight className="h-12 w-12 text-outline-variant/40" />
          </div>

          <div className="flex flex-col gap-6">
            <div className="group relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-surface-container-highest p-8 shadow-2xl">
              <div className="absolute right-0 top-0 p-2 opacity-20">
                <Cloud className="h-16 w-16" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-primary">{flow.aggregator.title}</h3>
              <p className="text-xs text-on-surface-variant">{flow.aggregator.subtitle}</p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error/10 p-4">
              <Swords className="h-6 w-6 text-error" />
              <div>
                <div className="text-xs font-bold text-error">{flow.attack.title}</div>
                <div className="text-[10px] text-on-surface opacity-60">{flow.attack.subtitle}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-tertiary/30 bg-tertiary/10 p-4">
              <Shield className="h-6 w-6 text-tertiary" />
              <div>
                <div className="text-xs font-bold text-tertiary">{flow.defense.title}</div>
                <div className="text-[10px] text-on-surface opacity-60">{flow.defense.subtitle}</div>
              </div>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <ArrowRight className="h-12 w-12 text-outline-variant/40" />
          </div>

          <div className="h-full">
            <div className="flex h-full flex-col justify-center rounded-2xl border border-primary/10 bg-surface-container-high p-8">
              <h3 className="mb-4 text-lg font-bold">{flow.output.title}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-60">{flow.output.scoreLabel}</span>
                  <span className="font-bold text-primary">{flow.output.scoreValue}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full w-[98%] bg-primary" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs opacity-60">{flow.output.latencyLabel}</span>
                  <span className="font-bold text-tertiary">{flow.output.latencyValue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {highlights.map((highlight) => {
            const tone = highlightToneClasses[highlight.tone];
            const icon =
              highlight.tone === 'primary' ? (
                <Network className="h-8 w-8" />
              ) : highlight.tone === 'error' ? (
                <Microscope className="h-8 w-8" />
              ) : (
                <ShieldCheck className="h-8 w-8" />
              );

            return (
              <div
                key={highlight.title}
                className={`group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-10 transition-all duration-500 ${tone.border}`}
              >
                <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${tone.badge} transition-transform group-hover:scale-110`}>
                  {icon}
                </div>
                <h3 className="mb-4 text-2xl font-bold text-on-surface">{highlight.title}</h3>
                <p className="leading-relaxed text-on-surface-variant">{highlight.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full">
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mb-4 text-3xl font-bold">代表性实验结果</h2>
            <p className="text-on-surface-variant">固定展示代表性联邦推荐安全实验结果，用于说明平台支持的典型输出形式与对比方式。</p>
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
                  index === 0 ? 'bg-outline-variant/20' : index === 1 ? 'bg-error/40' : 'bg-tertiary/60';
                const labelClass =
                  index === 0 ? 'text-on-surface-variant' : index === 1 ? 'text-error' : 'text-tertiary';

                return (
                  <div key={point.label} className="flex h-full flex-1 flex-col items-center justify-end">
                    <div
                      className={`w-full max-w-[80px] rounded-t-lg transition-all ${toneClass}`}
                      style={{height: `${point.value}%`}}
                    />
                    <div className={`mt-2 text-[10px] ${labelClass}`}>{point.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs italic text-on-surface-variant">
              基线、攻击与防御场景下的推荐性能对比（NDCG）
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
