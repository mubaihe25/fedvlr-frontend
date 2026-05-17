import React from 'react';
import {motion} from 'motion/react';
import {AlertTriangle, ArrowRight, Cloud, Database, Microscope, Network, Route, Shield, ShieldCheck, TrendingUp} from 'lucide-react';
import {AnimatedPipeline} from '../components/home/AnimatedPipeline';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {getDatasetLabel} from '../lib/showcaseFormat';
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

const mechanismIcons = {
  primary: Network,
  secondary: Cloud,
  tertiary: Microscope,
  error: ShieldCheck,
} as const;

const demoRoute: Array<{step: string; title: string; description: string; page: PageType}> = [
  {step: '01', title: '系统架构', description: '先看数据、融合、个性化、联邦训练和攻防评估的完整链路。', page: 'architecture'},
  {step: '02', title: '数据与融合', description: '看图像 / 文本 / 协同 ID 如何形成服务端多视图。', page: 'dataFusion'},
  {step: '03', title: '客户端个性化', description: '看本地历史如何决定 G1-G4 router 权重。', page: 'clientPersonalization'},
  {step: '04', title: '攻防靶场', description: '看投毒如何造成推荐偏移，鲁棒防御如何恢复。', page: 'attackDefenseRange'},
  {step: '05', title: '实验结果', description: '看 Recall@50、NDCG@50、攻击降幅和防御恢复率。', page: 'experimentResults'},
  {step: '06', title: '交付报告', description: '看最终总结、限制说明和后续 artifacts 接入计划。', page: 'deliveryReport'},
];

export const Home: React.FC<HomeProps> = ({onPageChange}) => {
  const {hero, pipeline, mechanisms, fusionRationale, snapshotMetrics, snapshotChart, capabilities} = mockHomeData;
  const {bundle, isLoading} = useShowcaseBundle();
  const findScenario = (keyword: string) =>
    bundle.scenarios.find((scenario) => [scenario.name, scenario.dataset, ...(scenario.tags ?? [])].join(' ').toLowerCase().includes(keyword));
  const kuScenario = findScenario('ku') ?? findScenario('mmfedrap');
  const amazonScenario = findScenario('amazon');

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
            选拔赛展示链路
          </motion.div>
          <motion.h1
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.1}}
            className="mb-6 bg-gradient-to-br from-white via-primary to-secondary bg-clip-text text-5xl font-bold leading-[1.1] tracking-tight text-transparent md:text-7xl"
          >
            多模态联邦推荐安全实验平台
          </motion.h1>
          <motion.p
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.2}}
            className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-on-surface-variant"
          >
            围绕“服务端多视图融合 + 客户端个性化路由”构建可解释展示链路，并串联联邦训练、投毒攻击、鲁棒防御和结果对比分析。
          </motion.p>
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.3}}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button
              onClick={() => onPageChange?.('architecture')}
              className="rounded-lg bg-gradient-to-r from-primary to-secondary px-8 py-4 font-bold text-surface shadow-[0_8px_32px_rgba(129,236,255,0.25)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(129,236,255,0.4)] active:scale-95"
            >
              开始演示路线
            </button>
            <button
              onClick={() => onPageChange?.('console')}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-highest/50 px-8 py-4 font-bold text-on-surface transition-all hover:bg-surface-container-highest active:scale-95"
            >
              打开训练控制台
            </button>
          </motion.div>
        </div>
      </section>

      <section className="rounded-3xl border border-primary/20 bg-surface-container-low p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Route className="h-3.5 w-3.5" />
              推荐演示路径
            </div>
            <h2 className="text-2xl font-bold text-on-surface">从机制到验证再到交付总结</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
              建议录屏或答辩按以下顺序展开：先讲完整链路，再解释双层融合机制，最后展示攻防验证和交付结论。
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {demoRoute.map((item) => (
            <button
              key={item.step}
              onClick={() => onPageChange?.(item.page)}
              className="group rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{item.step}</span>
                <ArrowRight className="h-4 w-4 text-on-surface-variant transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h3 className="font-bold text-on-surface">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">{item.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-secondary/20 bg-surface-container-low p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
              <Database className="h-3.5 w-3.5" />
              Showcase artifact 状态
            </div>
            <h2 className="text-2xl font-bold text-on-surface">真实场景入口</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
              首页首屏保持原录屏结构；下方展示 FedVLR-API showcase artifacts 的当前读取状态。API 不可用时自动使用 mock fallback。
            </p>
          </div>
          <div className="rounded-full border border-outline-variant/10 bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface">
            {isLoading ? '读取中' : bundle.dataSource === 'api' ? 'API artifact' : bundle.dataSource === 'mixed' ? 'API + fallback' : 'mock fallback'}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">当前 artifact</p>
            <h3 className="mt-2 text-lg font-bold text-on-surface">{bundle.selectedScenario.name}</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {getDatasetLabel(bundle.report.datasetProfile)} / {bundle.selectedScenario.model ?? bundle.report.model ?? '暂无 / 不适用'}
            </p>
            {bundle.fallbackReason ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-xs leading-5 text-on-surface">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" />
                <span className="break-words">{bundle.fallbackReason}</span>
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {title: 'KU / MMFedRAP', scenario: kuScenario, page: 'attackDefenseRange' as PageType},
              {title: 'Amazon Beauty', scenario: amazonScenario, page: 'dataFusion' as PageType},
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => onPageChange?.(item.page)}
                className="group rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4 text-left transition-all hover:-translate-y-0.5 hover:border-secondary/30"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-on-surface">{item.title}</h3>
                  <ArrowRight className="h-4 w-4 text-on-surface-variant transition-transform group-hover:translate-x-1 group-hover:text-secondary" />
                </div>
                <p className="text-xs leading-5 text-on-surface-variant">
                  {item.scenario
                    ? `${item.scenario.name} / ${item.scenario.dataset ?? '暂无 / 不适用'}`
                    : '当前 API/mock 未返回该数据集场景。'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(item.scenario?.tags ?? ['showcase']).slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-bold text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatedPipeline pipeline={pipeline} snapshotMetrics={snapshotMetrics} snapshotChart={snapshotChart} />

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
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
          <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-7 md:p-8">
            <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              双层融合机制
            </div>
            <h2 className="mb-4 text-3xl font-bold">{fusionRationale.title}</h2>
            <p className="leading-relaxed text-on-surface-variant md:text-lg">{fusionRationale.description}</p>
          </div>

          <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-5 md:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fusionRationale.personas.map((persona, index) => {
                const tone = toneClasses[persona.tone];

                return (
                  <div
                    key={persona.title}
                    className={`rounded-2xl border ${tone.ring} bg-surface-container-high p-4`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.badge}`}>
                        <span className="text-sm font-bold">{index < 3 ? index + 1 : 4}</span>
                      </div>
                      <div className="text-sm font-bold text-on-surface">{persona.title}</div>
                    </div>
                    <div className="text-sm text-on-surface-variant">{persona.description}</div>
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

    </div>
  );
};
