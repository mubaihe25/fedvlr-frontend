import React from 'react';
import {motion} from 'motion/react';
import {ArrowRight, Database, FileText, GitMerge, Image, Layers3, MonitorUp, Route, Server, ShieldCheck, Smartphone} from 'lucide-react';
import {FederatedTopology} from '../components/sandbox/FederatedTopology';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {hasAmazonUrlHashPlaceholder} from '../lib/showcaseFormat';

const architectureLayers = [
  {
    title: '数据层',
    desc: '把推荐系统需要的多源信号整理成本地训练输入。',
    items: ['商品图片', '文本描述', '交互记录'],
    tone: 'border-sky-200/25 bg-sky-200/10 text-sky-50',
    icon: Database,
  },
  {
    title: '客户端层',
    desc: '用户数据留在本地，只产生模型更新和个性化路由信号。',
    items: ['本地训练', '个性化路由'],
    tone: 'border-emerald-200/25 bg-emerald-200/10 text-emerald-50',
    icon: Smartphone,
  },
  {
    title: '服务端层',
    desc: '聚合多客户端更新，形成下一轮推荐模型。',
    items: ['模型聚合', '多视图融合'],
    tone: 'border-cyan-200/25 bg-cyan-200/10 text-cyan-50',
    icon: Server,
  },
  {
    title: '安全层',
    desc: '把隐私风险、定向投毒和鲁棒防御放入同一套验证链路。',
    items: ['成员推断', '交互还原', '目标投毒', '鲁棒防御'],
    tone: 'border-rose-200/25 bg-rose-200/10 text-rose-50',
    icon: ShieldCheck,
  },
  {
    title: '展示层',
    desc: '把导出的实验结果组织成可解释、可切换、可复核的沙盘。',
    items: ['artifact', 'API', '前端沙盘'],
    tone: 'border-violet-200/25 bg-violet-200/10 text-violet-50',
    icon: MonitorUp,
  },
];

const flowSteps = [
  {
    title: '数据接入',
    text: '图片、文本和交互记录进入客户端，形成推荐训练所需的本地信号。',
    icon: Database,
    tone: 'text-sky-100 bg-sky-200/10 border-sky-200/25',
  },
  {
    title: '多模态融合',
    text: '图像、文本和协同信号被融合成推荐模型可用的表示。',
    icon: Layers3,
    tone: 'text-violet-100 bg-violet-200/10 border-violet-200/25',
  },
  {
    title: '本地训练',
    text: '客户端在本地更新模型，原始用户行为不上传。',
    icon: Smartphone,
    tone: 'text-emerald-100 bg-emerald-200/10 border-emerald-200/25',
  },
  {
    title: '服务端聚合',
    text: '服务端聚合模型更新，形成下一轮全局推荐能力。',
    icon: Server,
    tone: 'text-cyan-100 bg-cyan-200/10 border-cyan-200/25',
  },
  {
    title: '双层融合',
    text: '服务端多视图融合与客户端个性化路由共同完成推荐。',
    icon: GitMerge,
    tone: 'text-amber-100 bg-amber-200/10 border-amber-200/25',
  },
];

const dataNodes = [
  {label: '商品图片', icon: Image, desc: '用于商品卡展示和图像侧信号说明。'},
  {label: '文本描述', icon: FileText, desc: '标题、类目和描述进入文本侧表示。'},
  {label: '交互记录', icon: Route, desc: '点击、浏览、购买等行为形成协同信号。'},
];

export const SystemMechanism: React.FC = () => {
  const {bundle} = useShowcaseBundle();
  const dataset = bundle.report.datasetProfile;
  const isAmazonPlaceholder = hasAmazonUrlHashPlaceholder(dataset, bundle.selectedScenario);

  return (
    <div className="space-y-6 pb-10">
      <section className="sandbox-panel sandbox-glow rounded-[32px] p-7">
        <div className="grid gap-7 xl:grid-cols-[0.72fr_1.28fr] xl:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200/30 bg-violet-200/10 px-3 py-1 text-xs font-bold text-violet-100">
              <MonitorUp className="h-3.5 w-3.5" />
              系统机制
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">正常推荐系统如何运转</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              数据在客户端侧完成输入和训练，服务端只聚合模型更新；安全验证层负责观察攻击与防御对推荐结果的影响。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {dataNodes.map((node) => (
                <div key={node.label} className="rounded-2xl border border-white/8 bg-white/[0.045] p-4">
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

      <section className="sandbox-panel rounded-[30px] p-6">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">主架构图</p>
          <h2 className="mt-2 text-2xl font-bold text-white">从本地数据到攻防沙盘的五层链路</h2>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
          <div className="grid gap-4 xl:grid-cols-5">
            {architectureLayers.map((layer, index) => (
              <motion.div
                key={layer.title}
                className={`relative rounded-3xl border p-5 backdrop-blur ${layer.tone}`}
                initial={{opacity: 0, y: 14}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: index * 0.06}}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/25">
                    <layer.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.2em] text-white/55">0{index + 1}</span>
                </div>
                <h3 className="text-lg font-bold">{layer.title}</h3>
                <p className="mt-2 min-h-12 text-xs leading-5 text-white/68">{layer.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <span key={item} className="rounded-full border border-white/15 bg-slate-950/30 px-3 py-1 text-xs font-semibold text-white/85">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="sandbox-panel rounded-[28px] p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">推荐训练流程</p>
            <h2 className="mt-2 text-2xl font-bold text-white">一轮联邦推荐的完整路径</h2>
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

      <section className="sandbox-panel rounded-[28px] p-6">
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
      </section>
    </div>
  );
};
