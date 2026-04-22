import React from 'react';
import {motion} from 'motion/react';
import {ArrowRight, Cloud, Microscope, Network, Shield, Swords, TrendingUp} from 'lucide-react';
import type {HomePipelineData, HomeSnapshotMetric} from '../../mock/home';
import type {ChartPoint} from '../../types/common';

interface AnimatedPipelineProps {
  pipeline: HomePipelineData;
  snapshotMetrics: HomeSnapshotMetric[];
  snapshotChart: ChartPoint[];
}

const toneClasses = {
  primary: {
    badge: 'bg-primary/12 text-primary border-primary/20',
    glow: 'shadow-[0_0_24px_rgba(129,236,255,0.18)]',
  },
  secondary: {
    badge: 'bg-secondary/12 text-secondary border-secondary/20',
    glow: 'shadow-[0_0_24px_rgba(116,185,255,0.18)]',
  },
  tertiary: {
    badge: 'bg-tertiary/12 text-tertiary border-tertiary/20',
    glow: 'shadow-[0_0_24px_rgba(85,239,196,0.18)]',
  },
  success: {
    badge: 'bg-success/12 text-success border-success/20',
    glow: 'shadow-[0_0_24px_rgba(0,184,148,0.18)]',
  },
  error: {
    badge: 'bg-error/12 text-error border-error/20',
    glow: 'shadow-[0_0_24px_rgba(255,118,117,0.18)]',
  },
} as const;

const inputIcons = [Network, Cloud, Microscope] as const;
const viewIcons = [Network, Cloud, Microscope, TrendingUp] as const;

const focusStyles = {
  visual: {
    strong: 'stroke-primary/80',
    soft: 'stroke-primary/25',
    label: 'text-primary',
  },
  text: {
    strong: 'stroke-secondary/80',
    soft: 'stroke-secondary/25',
    label: 'text-secondary',
  },
  collab: {
    strong: 'stroke-tertiary/80',
    soft: 'stroke-tertiary/25',
    label: 'text-tertiary',
  },
} as const;

interface FlowPathProps {
  d: string;
  gradientId: string;
  delay?: number;
  duration?: number;
  strokeWidth?: number;
  dashArray?: string;
  faint?: boolean;
}

const FlowPath: React.FC<FlowPathProps> = ({
  d,
  gradientId,
  delay = 0,
  duration = 3.4,
  strokeWidth = 2.6,
  dashArray = '8 16',
  faint = false,
}) => (
  <>
    <path
      d={d}
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeOpacity={faint ? 0.16 : 0.2}
    />
    <motion.path
      d={d}
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={dashArray}
      initial={{pathLength: 0, opacity: 0}}
      whileInView={{pathLength: 1, opacity: 0.95}}
      viewport={{once: true, amount: 0.2}}
      animate={{strokeDashoffset: [0, -120]}}
      transition={{
        pathLength: {duration: 1.25, delay, ease: 'easeOut'},
        opacity: {duration: 0.6, delay},
        strokeDashoffset: {duration, repeat: Infinity, ease: 'linear', delay},
      }}
    />
  </>
);

interface FloatingNodeProps {
  className?: string;
  tone: keyof typeof toneClasses;
  title: string;
  subtitle: string;
  caption?: string;
  icon?: React.ComponentType<{className?: string}>;
  delay?: number;
}

const FloatingNode: React.FC<FloatingNodeProps> = ({
  className,
  tone,
  title,
  subtitle,
  caption,
  icon: Icon,
  delay = 0,
}) => (
  <motion.div
    className={`absolute rounded-2xl border border-outline-variant/10 bg-surface-container-low/90 backdrop-blur-sm ${toneClasses[tone].glow} ${className ?? ''}`}
    initial={{opacity: 0, y: 18, scale: 0.96}}
    whileInView={{opacity: 1, y: 0, scale: 1}}
    viewport={{once: true, amount: 0.25}}
    animate={{y: [0, -5, 0]}}
    transition={{
      opacity: {duration: 0.55, delay},
      y: {duration: 0.55, delay},
      scale: {duration: 0.55, delay},
      default: {duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay},
    }}
  >
    <div className="flex items-start gap-3 p-4">
      {Icon ? (
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneClasses[tone].badge}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="min-w-0">
        <div className="text-sm font-bold text-on-surface">{title}</div>
        <div className="mt-1 text-xs leading-relaxed text-on-surface-variant">{subtitle}</div>
        {caption ? <div className="mt-2 text-[11px] font-medium text-primary">{caption}</div> : null}
      </div>
    </div>
  </motion.div>
);

export const AnimatedPipeline: React.FC<AnimatedPipelineProps> = ({
  pipeline,
  snapshotMetrics,
  snapshotChart,
}) => {
  return (
    <section className="w-full">
      <div className="mb-10 max-w-4xl">
        <div className="mb-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          动态系统总图
        </div>
        <h2 className="mb-4 text-3xl font-bold">{pipeline.title}</h2>
        <p className="text-lg leading-relaxed text-on-surface-variant">{pipeline.subtitle}</p>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-outline-variant/10 bg-surface-container-low/75 p-5 backdrop-blur-sm md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,236,255,0.12),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(116,185,255,0.1),transparent_26%),radial-gradient(circle_at_70%_80%,rgba(85,239,196,0.08),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

        <div className="relative hidden overflow-x-auto xl:block">
          <div className="relative h-[630px] min-w-[1320px]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1320 630" fill="none">
              <defs>
                <linearGradient id="flowPrimary" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(129,236,255,0.0)" />
                  <stop offset="40%" stopColor="rgba(129,236,255,0.85)" />
                  <stop offset="100%" stopColor="rgba(129,236,255,0.2)" />
                </linearGradient>
                <linearGradient id="flowSecondary" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(116,185,255,0.0)" />
                  <stop offset="40%" stopColor="rgba(116,185,255,0.9)" />
                  <stop offset="100%" stopColor="rgba(116,185,255,0.2)" />
                </linearGradient>
                <linearGradient id="flowTertiary" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(85,239,196,0.0)" />
                  <stop offset="40%" stopColor="rgba(85,239,196,0.85)" />
                  <stop offset="100%" stopColor="rgba(85,239,196,0.2)" />
                </linearGradient>
                <linearGradient id="flowSuccess" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(0,184,148,0.0)" />
                  <stop offset="40%" stopColor="rgba(0,184,148,0.8)" />
                  <stop offset="100%" stopColor="rgba(0,184,148,0.2)" />
                </linearGradient>
                <linearGradient id="flowDanger" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,118,117,0.0)" />
                  <stop offset="50%" stopColor="rgba(255,118,117,0.95)" />
                  <stop offset="100%" stopColor="rgba(255,118,117,0.15)" />
                </linearGradient>
              </defs>

              <FlowPath d="M 160 150 C 200 150 220 210 250 284" gradientId="flowPrimary" delay={0.2} />
              <FlowPath d="M 160 280 C 210 280 224 280 250 284" gradientId="flowSecondary" delay={0.45} />
              <FlowPath d="M 160 410 C 205 410 224 340 250 284" gradientId="flowTertiary" delay={0.7} />

              <FlowPath d="M 392 284 C 450 220 460 150 520 124" gradientId="flowPrimary" delay={0.95} />
              <FlowPath d="M 392 284 C 450 245 470 230 520 232" gradientId="flowSecondary" delay={1.1} />
              <FlowPath d="M 392 284 C 450 315 470 320 520 340" gradientId="flowTertiary" delay={1.25} />
              <FlowPath d="M 392 284 C 450 350 475 420 520 448" gradientId="flowSuccess" delay={1.4} />

              <FlowPath d="M 694 124 C 744 124 762 124 802 154" gradientId="flowPrimary" delay={1.55} />
              <FlowPath d="M 694 448 C 740 442 770 420 804 430" gradientId="flowSuccess" delay={1.65} faint />
              <FlowPath d="M 694 232 C 760 232 780 270 802 292" gradientId="flowSecondary" delay={1.75} />
              <FlowPath d="M 694 448 C 754 410 774 346 802 306" gradientId="flowSecondary" delay={1.85} faint />
              <FlowPath d="M 694 340 C 748 340 770 360 802 430" gradientId="flowTertiary" delay={1.95} />
              <FlowPath d="M 694 448 C 748 454 770 448 802 444" gradientId="flowTertiary" delay={2.05} faint />

              <FlowPath d="M 962 168 C 1014 190 1034 220 1050 280" gradientId="flowPrimary" delay={2.2} />
              <FlowPath d="M 962 306 C 1015 306 1033 306 1050 306" gradientId="flowSecondary" delay={2.35} />
              <FlowPath d="M 962 444 C 1014 422 1034 392 1050 332" gradientId="flowTertiary" delay={2.5} />

              <FlowPath
                d="M 962 306 C 1002 250 1020 210 1048 186"
                gradientId="flowDanger"
                delay={2.55}
                duration={2.6}
                dashArray="10 10"
                strokeWidth={2.8}
              />

              <FlowPath d="M 1144 306 C 1186 306 1208 306 1228 306" gradientId="flowSuccess" delay={2.7} />
              <FlowPath d="M 1290 306 C 1290 246 1252 204 1200 174" gradientId="flowSuccess" delay={2.85} />

              <motion.circle
                cx="250"
                cy="284"
                r="6"
                fill="rgba(129,236,255,0.95)"
                animate={{opacity: [0.35, 1, 0.35], scale: [0.8, 1.25, 0.8]}}
                transition={{duration: 2.8, repeat: Infinity, ease: 'easeInOut'}}
              />
              <motion.circle
                cx="1050"
                cy="306"
                r="5"
                fill="rgba(255,255,255,0.92)"
                animate={{opacity: [0.25, 0.95, 0.25], scale: [0.8, 1.15, 0.8]}}
                transition={{duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8}}
              />
            </svg>

            <div className="pointer-events-none absolute left-4 top-4 inline-flex rounded-full border border-primary/20 bg-surface-container-high/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.26em] text-primary/90">
              多模态输入汇聚
            </div>
            <div className="pointer-events-none absolute left-[432px] top-4 inline-flex rounded-full border border-secondary/20 bg-surface-container-high/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.26em] text-secondary/90">
              服务端多视图融合
            </div>
            <div className="pointer-events-none absolute left-[748px] top-4 inline-flex rounded-full border border-tertiary/20 bg-surface-container-high/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.26em] text-tertiary/90">
              客户端个性化路由
            </div>
            <div className="pointer-events-none absolute left-[984px] top-[198px] inline-flex rounded-full border border-error/20 bg-surface-container-high/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.26em] text-error/90">
              联邦聚合与安全增强
            </div>
            <div className="pointer-events-none absolute right-6 top-4 inline-flex rounded-full border border-success/20 bg-surface-container-high/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.26em] text-success/90">
              实验输出与对比分析
            </div>

            <FloatingNode
              className="left-[20px] top-[86px] w-[126px]"
              tone={pipeline.inputs[0].tone}
              title={pipeline.inputs[0].title}
              subtitle={pipeline.inputs[0].subtitle}
              icon={inputIcons[0]}
              delay={0.12}
            />
            <FloatingNode
              className="left-[20px] top-[216px] w-[126px]"
              tone={pipeline.inputs[1].tone}
              title={pipeline.inputs[1].title}
              subtitle={pipeline.inputs[1].subtitle}
              icon={inputIcons[1]}
              delay={0.24}
            />
            <FloatingNode
              className="left-[20px] top-[346px] w-[126px]"
              tone={pipeline.inputs[2].tone}
              title={pipeline.inputs[2].title}
              subtitle={pipeline.inputs[2].subtitle}
              icon={inputIcons[2]}
              delay={0.36}
            />

            <motion.div
              className="absolute left-[188px] top-[218px] w-[220px] rounded-[28px] border border-primary/20 bg-surface-container-highest/90 p-6 text-center shadow-[0_0_32px_rgba(129,236,255,0.16)] backdrop-blur-sm"
              initial={{opacity: 0, scale: 0.94}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true, amount: 0.3}}
              animate={{boxShadow: ['0 0 18px rgba(129,236,255,0.12)', '0 0 36px rgba(129,236,255,0.22)', '0 0 18px rgba(129,236,255,0.12)']}}
              transition={{
                opacity: {duration: 0.55, delay: 0.55},
                scale: {duration: 0.55, delay: 0.55},
                boxShadow: {duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8},
              }}
            >
              <div className="mb-3 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Network className="h-7 w-7" />
                </div>
              </div>
              <div className="text-lg font-bold text-on-surface">{pipeline.core.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-on-surface-variant">{pipeline.core.subtitle}</div>
            </motion.div>

            <FloatingNode
              className="left-[520px] top-[86px] w-[176px]"
              tone={pipeline.views[0].tone}
              title={pipeline.views[0].title}
              subtitle={pipeline.views[0].subtitle}
              icon={viewIcons[0]}
              delay={0.9}
            />
            <FloatingNode
              className="left-[520px] top-[194px] w-[176px]"
              tone={pipeline.views[1].tone}
              title={pipeline.views[1].title}
              subtitle={pipeline.views[1].subtitle}
              icon={viewIcons[1]}
              delay={1.05}
            />
            <FloatingNode
              className="left-[520px] top-[302px] w-[176px]"
              tone={pipeline.views[2].tone}
              title={pipeline.views[2].title}
              subtitle={pipeline.views[2].subtitle}
              icon={viewIcons[2]}
              delay={1.2}
            />
            <FloatingNode
              className="left-[520px] top-[410px] w-[176px]"
              tone={pipeline.views[3].tone}
              title={pipeline.views[3].title}
              subtitle={pipeline.views[3].subtitle}
              icon={viewIcons[3]}
              delay={1.35}
            />

            {pipeline.clients.map((client, index) => {
              const top = 120 + index * 138;
              const focus = focusStyles[client.focus];

              return (
                <motion.div
                  key={client.title}
                  className="absolute left-[804px] w-[158px] rounded-2xl border border-outline-variant/10 bg-surface-container-low/90 p-4 shadow-[0_0_24px_rgba(129,236,255,0.08)] backdrop-blur-sm"
                  style={{top}}
                  initial={{opacity: 0, x: 18}}
                  whileInView={{opacity: 1, x: 0}}
                  viewport={{once: true, amount: 0.25}}
                  animate={{y: [0, -4, 0]}}
                  transition={{
                    opacity: {duration: 0.55, delay: 1.5 + index * 0.12},
                    x: {duration: 0.55, delay: 1.5 + index * 0.12},
                    default: {duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 + index * 0.12},
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-on-surface">{client.title}</span>
                    <span className={`text-[11px] font-medium ${focus.label}`}>{client.emphasis}</span>
                  </div>
                  <div className="text-xs leading-relaxed text-on-surface-variant">{client.subtitle}</div>
                  <div className="mt-3 flex gap-1.5">
                    <div className={`h-1.5 flex-1 rounded-full ${client.focus === 'visual' ? 'bg-primary/80' : 'bg-primary/20'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${client.focus === 'text' ? 'bg-secondary/80' : 'bg-secondary/20'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${client.focus === 'collab' ? 'bg-tertiary/80' : 'bg-tertiary/20'}`} />
                  </div>
                </motion.div>
              );
            })}

            <motion.div
              className="absolute left-[1048px] top-[248px] w-[96px] rounded-[28px] border border-error/20 bg-surface-container-highest/90 p-4 text-center shadow-[0_0_28px_rgba(255,118,117,0.12)] backdrop-blur-sm"
              initial={{opacity: 0, scale: 0.96}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true, amount: 0.3}}
              animate={{boxShadow: ['0 0 16px rgba(255,118,117,0.08)', '0 0 28px rgba(255,118,117,0.2)', '0 0 16px rgba(255,118,117,0.08)']}}
              transition={{
                opacity: {duration: 0.55, delay: 2.5},
                scale: {duration: 0.55, delay: 2.5},
                boxShadow: {duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 2.8},
              }}
            >
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-error/20 bg-error/10 text-error">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
              <div className="text-sm font-bold text-on-surface">{pipeline.security.title}</div>
              <div className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">{pipeline.security.subtitle}</div>
              <div className="mt-4 space-y-2">
                {pipeline.security.items.map((item, index) => (
                  <motion.div
                    key={item}
                    className={`rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                      index === 0
                        ? 'border border-error/20 bg-error/10 text-error'
                        : index === 1
                          ? 'border border-primary/20 bg-primary/10 text-primary'
                          : 'border border-tertiary/20 bg-tertiary/10 text-tertiary'
                    }`}
                    animate={{opacity: [0.65, 1, 0.65]}}
                    transition={{duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 2.9 + index * 0.2}}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="absolute left-[1224px] top-[246px] w-[86px] rounded-[26px] border border-success/20 bg-surface-container-highest/90 p-4 text-center shadow-[0_0_26px_rgba(0,184,148,0.14)] backdrop-blur-sm"
              initial={{opacity: 0, scale: 0.96}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true, amount: 0.3}}
              animate={{boxShadow: ['0 0 16px rgba(0,184,148,0.08)', '0 0 26px rgba(0,184,148,0.2)', '0 0 16px rgba(0,184,148,0.08)']}}
              transition={{
                opacity: {duration: 0.55, delay: 2.8},
                scale: {duration: 0.55, delay: 2.8},
                boxShadow: {duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 3.1},
              }}
            >
              <div className="mb-3 flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-success/20 bg-success/10 text-success">
                  <Swords className="h-5 w-5 rotate-90" />
                </div>
              </div>
              <div className="text-sm font-bold text-on-surface">{pipeline.aggregator.title}</div>
              <div className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">{pipeline.aggregator.subtitle}</div>
            </motion.div>

            <motion.div
              className="absolute left-[1012px] top-[58px] w-[274px] rounded-[28px] border border-success/20 bg-surface-container-highest/92 p-5 shadow-[0_0_32px_rgba(0,184,148,0.12)] backdrop-blur-sm"
              initial={{opacity: 0, y: 18}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.2}}
              transition={{duration: 0.65, delay: 3}}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-on-surface">{pipeline.output.title}</div>
                  <div className="mt-1 text-xs text-on-surface-variant">{pipeline.output.subtitle}</div>
                </div>
                <div className="rounded-xl border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                  输出面板
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {pipeline.output.experimentModes.map((mode, index) => (
                  <motion.div
                    key={mode}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      index === 0
                        ? 'bg-primary/10 text-primary'
                        : index === 1
                          ? 'bg-error/10 text-error'
                          : 'bg-tertiary/10 text-tertiary'
                    }`}
                    animate={{opacity: [0.55, 1, 0.55]}}
                    transition={{duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 3.2 + index * 0.2}}
                  >
                    {mode}
                  </motion.div>
                ))}
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                {snapshotMetrics.map((metric) => (
                  <div key={metric.key} className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                      {metric.title}
                    </div>
                    <motion.div
                      className="mt-2 text-xl font-bold text-primary"
                      animate={{opacity: [0.72, 1, 0.72]}}
                      transition={{duration: 3.6, repeat: Infinity, ease: 'easeInOut'}}
                    >
                      {metric.value}
                    </motion.div>
                  </div>
                ))}
              </div>

              <div className="flex h-28 items-end justify-between gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-high p-3">
                {snapshotChart.map((point, index) => {
                  const toneClass =
                    index === 0 ? 'bg-primary/60' : index === 1 ? 'bg-error/55' : 'bg-tertiary/65';

                  return (
                    <div key={point.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <div className="flex h-16 w-full items-end justify-center">
                        <motion.div
                          className={`w-10 rounded-t-lg ${toneClass}`}
                          initial={{height: 0}}
                          whileInView={{height: `${point.value ?? 0}%`}}
                          viewport={{once: true, amount: 0.4}}
                          transition={{duration: 0.8, delay: 3.5 + index * 0.16, ease: 'easeOut'}}
                        />
                      </div>
                      <div className="text-[11px] text-on-surface-variant">{point.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-on-surface-variant">
                {pipeline.output.metricLabels.map((label) => (
                  <span key={label} className="rounded-full bg-surface-container px-2.5 py-1">
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative space-y-4 xl:hidden">
          <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary/90">多模态输入汇聚</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {pipeline.inputs.map((input, index) => {
                const Icon = inputIcons[index] ?? Network;
                const tone = toneClasses[input.tone];

                return (
                  <motion.div
                    key={input.title}
                    className={`rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4 ${tone.glow}`}
                    initial={{opacity: 0, y: 16}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, amount: 0.35}}
                    transition={{duration: 0.45, delay: index * 0.12}}
                  >
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${tone.badge}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-bold text-on-surface">{input.title}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">{input.subtitle}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center text-outline-variant">
            <ArrowRight className="h-5 w-5 rotate-90" />
          </div>

          <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-secondary/90">服务端多视图融合</div>
            <div className="mb-4 rounded-2xl border border-primary/20 bg-surface-container-high p-4 text-center">
              <div className="text-base font-bold text-on-surface">{pipeline.core.title}</div>
              <div className="mt-1 text-sm text-on-surface-variant">{pipeline.core.subtitle}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {pipeline.views.map((view, index) => {
                const tone = toneClasses[view.tone];

                return (
                  <motion.div
                    key={view.title}
                    className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4"
                    initial={{opacity: 0, y: 16}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, amount: 0.35}}
                    transition={{duration: 0.45, delay: 0.15 + index * 0.1}}
                  >
                    <div className={`mb-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone.badge}`}>
                      预融合视图
                    </div>
                    <div className="text-sm font-bold text-on-surface">{view.title}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">{view.subtitle}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center text-outline-variant">
            <ArrowRight className="h-5 w-5 rotate-90" />
          </div>

          <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-tertiary/90">客户端个性化路由</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {pipeline.clients.map((client, index) => {
                const focus = focusStyles[client.focus];

                return (
                  <motion.div
                    key={client.title}
                    className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4"
                    initial={{opacity: 0, y: 16}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, amount: 0.35}}
                    transition={{duration: 0.45, delay: 0.1 + index * 0.1}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-on-surface">{client.title}</div>
                      <span className={`text-[11px] font-medium ${focus.label}`}>{client.emphasis}</span>
                    </div>
                    <div className="mt-2 text-xs text-on-surface-variant">{client.subtitle}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center text-outline-variant">
            <ArrowRight className="h-5 w-5 rotate-90" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
            <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-error/90">联邦聚合与安全增强</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {pipeline.security.items.map((item, index) => (
                  <motion.div
                    key={item}
                    className={`rounded-2xl border px-4 py-4 text-center text-sm font-medium ${
                      index === 0
                        ? 'border-error/20 bg-error/10 text-error'
                        : index === 1
                          ? 'border-primary/20 bg-primary/10 text-primary'
                          : 'border-tertiary/20 bg-tertiary/10 text-tertiary'
                    }`}
                    animate={{opacity: [0.7, 1, 0.7]}}
                    transition={{duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2}}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-success/20 bg-surface-container-high p-4">
                <div className="text-sm font-bold text-on-surface">{pipeline.aggregator.title}</div>
                <div className="mt-1 text-xs text-on-surface-variant">{pipeline.aggregator.subtitle}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-success/90">实验输出与对比分析</div>
              <div className="mb-3 flex flex-wrap gap-2">
                {pipeline.output.experimentModes.map((mode, index) => (
                  <div
                    key={mode}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      index === 0
                        ? 'bg-primary/10 text-primary'
                        : index === 1
                          ? 'bg-error/10 text-error'
                          : 'bg-tertiary/10 text-tertiary'
                    }`}
                  >
                    {mode}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {snapshotMetrics.map((metric) => (
                  <div key={metric.key} className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-3">
                    <div className="text-[11px] text-on-surface-variant">{metric.title}</div>
                    <div className="mt-2 text-xl font-bold text-primary">{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
