import React from 'react';
import {motion} from 'motion/react';
import {ArrowRight, Database, FileText, GitMerge, Image, Layers3, MonitorUp, Route, Server, Smartphone} from 'lucide-react';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {formatPlainValue, getDatasetLabel, hasAmazonUrlHashPlaceholder} from '../lib/showcaseFormat';

const flowSteps = [
  {
    title: '数据接入',
    text: '商品图片、文本描述、交互 ID 在客户端侧形成本地训练输入。',
    icon: Database,
    tone: 'text-sky-100 bg-sky-200/10 border-sky-200/25',
  },
  {
    title: '多模态融合',
    text: '图像、文本和协同信号被融合为推荐模型可用的表示。',
    icon: Layers3,
    tone: 'text-violet-100 bg-violet-200/10 border-violet-200/25',
  },
  {
    title: '客户端本地训练',
    text: '用户历史不出本地，客户端只产生模型更新。',
    icon: Smartphone,
    tone: 'text-emerald-100 bg-emerald-200/10 border-emerald-200/25',
  },
  {
    title: '服务端聚合',
    text: '服务器聚合模型更新，形成下一轮全局推荐模型。',
    icon: Server,
    tone: 'text-cyan-100 bg-cyan-200/10 border-cyan-200/25',
  },
  {
    title: '双层融合机制',
    text: '服务端多视图融合 + 客户端个性化路由，兼顾全局能力和用户差异。',
    icon: GitMerge,
    tone: 'text-amber-100 bg-amber-200/10 border-amber-200/25',
  },
];

const dataNodes = [
  {label: '商品图片', icon: Image, desc: 'Amazon 商品图优先展示本地缓存图。'},
  {label: '文本描述', icon: FileText, desc: '标题、类目、描述进入文本侧特征。'},
  {label: '交互 ID', icon: Route, desc: '点击、浏览、购买等隐式反馈用于协同信号。'},
];

const architectureLayers = [
  {title: '数据层', items: ['商品图片', '文本描述', '交互记录'], tone: 'border-sky-200/25 bg-sky-200/10 text-sky-50'},
  {title: '客户端层', items: ['本地训练', '个性化路由'], tone: 'border-emerald-200/25 bg-emerald-200/10 text-emerald-50'},
  {title: '服务端层', items: ['模型聚合', '多视图融合'], tone: 'border-cyan-200/25 bg-cyan-200/10 text-cyan-50'},
  {title: '安全层', items: ['成员推断', '交互还原', '定向投毒', '鲁棒防御'], tone: 'border-rose-200/25 bg-rose-200/10 text-rose-50'},
  {title: '展示层', items: ['artifact', 'API', '前端沙盘'], tone: 'border-violet-200/25 bg-violet-200/10 text-violet-50'},
];

export const SystemMechanism: React.FC = () => {
  const {bundle} = useShowcaseBundle();
  const dataset = bundle.report.datasetProfile;
  const isAmazonPlaceholder = hasAmazonUrlHashPlaceholder(dataset, bundle.selectedScenario);

  return (
    <div className="space-y-6 pb-10">
      <section className="sandbox-panel sandbox-glow rounded-[32px] p-7">
        <div className="grid gap-7 xl:grid-cols-[0.76fr_1.24fr] xl:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200/30 bg-violet-200/10 px-3 py-1 text-xs font-bold text-violet-100">
              <MonitorUp className="h-3.5 w-3.5" />
              系统机制
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">正常推荐系统怎么工作</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              本页只讲正常链路：数据进入本地客户端，多模态信号融合，本地训练生成模型更新，服务端聚合，再回到个性化推荐。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {dataNodes.map((node) => (
                <div key={node.label} className="rounded-2xl bg-white/[0.055] p-4">
                  <node.icon className="h-5 w-5 text-cyan-100" />
                  <p className="mt-3 font-bold text-slate-50">{node.label}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{node.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <FederatedTopology mode="overview" defenseActive className="min-h-[470px]" />
        </div>
      </section>

      <section className="sandbox-panel rounded-[28px] p-6">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">系统架构图</p>
          <h2 className="mt-2 text-2xl font-bold text-white">从本地数据到攻防沙盘的五层链路</h2>
        </div>
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
          <div className="absolute left-8 right-8 top-1/2 hidden h-px bg-gradient-to-r from-sky-200/20 via-emerald-200/35 to-violet-200/20 xl:block" />
          <div className="grid gap-4 xl:grid-cols-5">
            {architectureLayers.map((layer, index) => (
              <div key={layer.title} className={`relative rounded-3xl border p-5 backdrop-blur ${layer.tone}`}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.2em] text-white/60">0{index + 1}</span>
                  <span className="h-2 w-2 rounded-full bg-current shadow-[0_0_18px_currentColor]" />
                </div>
                <h3 className="text-lg font-bold">{layer.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <span key={item} className="rounded-full border border-white/15 bg-slate-950/30 px-3 py-1 text-xs font-semibold text-white/85">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sandbox-panel rounded-[28px] p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">推荐训练流程</p>
            <h2 className="mt-2 text-2xl font-bold text-white">从本地数据到全局模型</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xs leading-5 text-slate-300">
            当前数据集：{getDatasetLabel(dataset)} / 模型：{formatPlainValue(bundle.report.model ?? bundle.selectedScenario.model)}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-5">
          {flowSteps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative rounded-3xl border border-white/10 bg-white/[0.052] p-5"
              initial={{opacity: 0, y: 14}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: index * 0.07}}
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${step.tone}`}>
                <step.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-50">{index + 1}. {step.title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.text}</p>
              {index < flowSteps.length - 1 ? (
                <ArrowRight className="absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-cyan-100/50 xl:block" />
              ) : null}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="sandbox-panel rounded-[28px] p-6">
          <p className="text-xs font-bold tracking-[0.2em] text-violet-100/75">双层融合机制</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-violet-200/20 bg-violet-200/10 p-5">
              <p className="text-lg font-bold text-violet-50">服务端多视图融合</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">服务端聚合来自多客户端的图像、文本和协同信号更新，形成稳定的全局推荐能力。</p>
            </div>
            <div className="rounded-3xl border border-emerald-200/20 bg-emerald-200/10 p-5">
              <p className="text-lg font-bold text-emerald-50">客户端个性化路由</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">客户端根据本地用户偏好调整不同视图权重，让全局模型适配本地兴趣差异。</p>
            </div>
          </div>
        </div>

        <div className="sandbox-panel rounded-[28px] p-6">
          <p className="text-xs font-bold tracking-[0.2em] text-amber-100/75">特征边界</p>
          <h3 className="mt-2 text-xl font-bold text-white">Amazon 图像特征说明</h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {isAmazonPlaceholder
              ? '当前 Amazon image_features 标注为 URL-hash placeholder，它只是为了端到端展示和推荐卡图片映射，不是真实视觉 embedding。'
              : '若后续场景出现 Amazon URL-hash image_features，必须继续标注为占位特征，不写成真实视觉 embedding。'}
          </p>
        </div>
      </section>
    </div>
  );
};
