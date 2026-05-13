import React, {useState} from 'react';
import {motion} from 'motion/react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  Download,
  FileText,
  Image,
  Layers,
  Network,
  Shield,
  Upload,
  Users,
} from 'lucide-react';
import {ShowcasePageHeader} from '../components/showcase/ShowcasePageHeader';
import {cn} from '../lib/utils';

const architectureLayers = [
  {
    id: 'data',
    title: '数据接入层',
    subtitle: '原始推荐样本进入展示与训练链路',
    icon: Database,
    tone: 'primary',
    inputs: ['用户行为', '物品图片/视频封面', '文本描述', '标签', '协同 ID', '交互日志'],
    process: '统一组织用户、物品与多模态字段，为后续表征学习和联邦训练提供结构化输入。',
    outputs: ['样本索引', '模态可用性', '交互序列'],
    focus: '解决“哪些数据进入 FedVLR 链路”的问题，并明确展示样本与真实训练 artifact 的替换边界。',
  },
  {
    id: 'embedding',
    title: '多模态表征层',
    subtitle: '图像、文本、协同 ID 被转化为可计算向量',
    icon: Image,
    tone: 'secondary',
    inputs: ['图像/封面特征', '标题与描述文本', '用户-物品 ID 关系'],
    process: '分别生成图像 embedding、文本 embedding 和协同 ID embedding，避免把多模态信息简化为单一路径。',
    outputs: ['image embedding', 'text embedding', 'collaborative ID embedding'],
    focus: '解决“不同模态如何进入统一推荐空间”的问题，为服务端多视图融合提供基础表征。',
  },
  {
    id: 'server-fusion',
    title: '服务端多视图融合层',
    subtitle: '服务端预先形成 G1-G4 多个融合解释视图',
    icon: Layers,
    tone: 'tertiary',
    inputs: ['三类 embedding', '融合策略', '全局统计线索'],
    process: '服务端承担高开销全局表征构建，生成多个可供客户端选择的融合视图，而不是只做简单拼接。',
    outputs: ['G1 偏视觉信号', 'G2 偏文本语义', 'G3 偏协同关系', 'G4 综合融合'],
    focus: '解决“全局多模态知识如何下发给不同客户端使用”的问题，是后续个性化路由的候选视图来源。',
  },
  {
    id: 'client-router',
    title: '客户端个性化路由层',
    subtitle: '客户端根据本地历史选择不同服务端视图权重',
    icon: Users,
    tone: 'primary',
    inputs: ['本地交互历史', 'router 权重', 'G1-G4 服务端视图'],
    process: '每个客户端保留本地偏好，并对服务端视图进行个性化加权，形成用户特定推荐表示。',
    outputs: ['个性化融合表示', 'Top-K 推荐输出', '本地训练目标'],
    focus: '解决“不同用户为什么不应使用同一个固定融合结果”的问题，是 FedVLR 区别于简单多模态融合的关键展示点。',
  },
  {
    id: 'federated',
    title: '联邦训练通信层',
    subtitle: '服务端下发、本地训练、上传更新、聚合再下发',
    icon: Network,
    tone: 'secondary',
    inputs: ['全局参数', '本地训练批次', '共享更新'],
    process: '服务端下发参数和视图，客户端本地训练后上传共享更新，服务端聚合后进入下一轮。',
    outputs: ['客户端更新', '聚合结果', '下一轮全局参数'],
    focus: '解决“个性化推荐如何在联邦范式下迭代”的问题，同时保持原始用户行为不直接上传。',
  },
  {
    id: 'security',
    title: '安全增强与实验评估层',
    subtitle: '围绕攻防与结果指标形成可解释实验闭环',
    icon: Shield,
    tone: 'tertiary',
    inputs: ['投毒攻击', '鲁棒防御', '风险观测', '实验结果'],
    process: '在联邦更新链路中展示异常更新、鲁棒处理和风险观测，并用统一指标呈现恢复效果。',
    outputs: ['Recall@50', 'NDCG@50', '攻防对比分析'],
    focus: '解决“攻防机制如何影响推荐质量”的问题。本层不把差分隐私、同态加密或安全聚合描述为当前已实现能力。',
  },
] as const;

const toneClasses = {
  primary: {
    text: 'text-primary',
    border: 'border-primary/25',
    bg: 'bg-primary/10',
    gradient: 'from-primary/20 to-primary/5',
    line: 'bg-primary',
  },
  secondary: {
    text: 'text-secondary',
    border: 'border-secondary/25',
    bg: 'bg-secondary/10',
    gradient: 'from-secondary/20 to-secondary/5',
    line: 'bg-secondary',
  },
  tertiary: {
    text: 'text-tertiary',
    border: 'border-tertiary/25',
    bg: 'bg-tertiary/10',
    gradient: 'from-tertiary/20 to-tertiary/5',
    line: 'bg-tertiary',
  },
} as const;

const chainSummaries = [
  {
    title: '数据链路',
    icon: Database,
    steps: ['原始样本', 'embedding', 'fused views'],
    description: '从用户行为和物品模态出发，形成可被客户端路由使用的服务端多视图。',
  },
  {
    title: '联邦链路',
    icon: Upload,
    steps: ['本地训练', '上传更新', '服务端聚合'],
    description: '客户端保留本地历史，只上传共享更新和训练统计摘要，由服务端完成聚合。',
  },
  {
    title: '安全链路',
    icon: BarChart3,
    steps: ['异常更新', '鲁棒防御', '结果恢复'],
    description: '围绕投毒攻击、鲁棒处理和风险观测解释 Recall@50 / NDCG@50 的变化。',
  },
];

export const Architecture: React.FC = () => {
  const [selectedLayerId, setSelectedLayerId] = useState<(typeof architectureLayers)[number]['id']>('server-fusion');
  const selectedLayer = architectureLayers.find((layer) => layer.id === selectedLayerId) ?? architectureLayers[0];
  const selectedTone = toneClasses[selectedLayer.tone];

  return (
    <div className="space-y-10 pb-16">
      <ShowcasePageHeader
        eyebrow="选拔赛展示链路"
        title="系统架构"
        description="从数据接入、多模态表征、服务端多视图、客户端个性化、联邦训练到攻防评估的完整链路。"
        chips={['服务端多视图融合 + 客户端个性化路由', '客户端本地训练 → 上传共享更新 → 服务端聚合', '投毒攻击 → 鲁棒防御处理 → 推荐效果恢复']}
        icon={Network}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {architectureLayers.map((layer, index) => {
            const tone = toneClasses[layer.tone];
            const isSelected = selectedLayerId === layer.id;

            return (
              <motion.button
                key={layer.id}
                type="button"
                onClick={() => setSelectedLayerId(layer.id)}
                initial={{opacity: 0, y: 14}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: index * 0.04}}
                className={cn(
                  'group w-full rounded-2xl border bg-surface-container-low p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-container-high',
                  isSelected ? tone.border : 'border-outline-variant/10',
                )}
              >
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="flex items-start gap-4">
                    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', tone.border, tone.bg)}>
                      <layer.icon className={cn('h-6 w-6', tone.text)} />
                    </div>
                    <div>
                      <div className={cn('text-xs font-bold uppercase tracking-[0.2em]', tone.text)}>Layer {index + 1}</div>
                      <h3 className="mt-1 text-lg font-bold text-on-surface">{layer.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-on-surface-variant">{layer.subtitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-surface-container-high px-4 py-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">输入</p>
                      <div className="flex flex-wrap gap-1.5">
                        {layer.inputs.slice(0, 4).map((item) => (
                          <span key={item} className="rounded-full bg-surface-container-highest px-2 py-1 text-[11px] text-on-surface">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-surface-container-high px-4 py-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">处理</p>
                      <p className="line-clamp-3 text-xs leading-5 text-on-surface-variant">{layer.process}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container-high px-4 py-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">输出</p>
                      <div className="flex flex-wrap gap-1.5">
                        {layer.outputs.map((item) => (
                          <span key={item} className={cn('rounded-full px-2 py-1 text-[11px]', tone.bg, tone.text)}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 xl:sticky xl:top-24 xl:self-start">
          <div className={cn('mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border', selectedTone.border, selectedTone.bg)}>
            <selectedLayer.icon className={cn('h-6 w-6', selectedTone.text)} />
          </div>
          <p className={cn('mb-2 text-xs font-bold uppercase tracking-[0.2em]', selectedTone.text)}>重点层说明</p>
          <h3 className="text-2xl font-bold text-on-surface">{selectedLayer.title}</h3>
          <p className="mt-4 text-sm leading-7 text-on-surface-variant">{selectedLayer.focus}</p>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-surface-container-high p-4">
              <p className="mb-2 text-xs font-bold text-on-surface-variant">处理说明</p>
              <p className="text-sm leading-6 text-on-surface">{selectedLayer.process}</p>
            </div>
            <div className="rounded-xl bg-surface-container-high p-4">
              <p className="mb-2 text-xs font-bold text-on-surface-variant">关键输出</p>
              <div className="flex flex-wrap gap-2">
                {selectedLayer.outputs.map((item) => (
                  <span key={item} className={cn('rounded-full px-3 py-1 text-xs font-medium', selectedTone.bg, selectedTone.text)}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {chainSummaries.map((chain) => (
          <div key={chain.title} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <chain.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">{chain.title}</h3>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chain.steps.map((step, index) => (
                <React.Fragment key={step}>
                  <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface">{step}</span>
                  {index < chain.steps.length - 1 ? <ArrowRight className="h-4 w-4 text-primary/60" /> : null}
                </React.Fragment>
              ))}
            </div>
            <p className="text-sm leading-6 text-on-surface-variant">{chain.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-primary/20 bg-[#0c141b] p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-high/70 p-4">
            <Download className="h-5 w-5 text-primary" />
            <span className="text-sm text-on-surface">服务端下发视图与参数</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-high/70 p-4">
            <Activity className="h-5 w-5 text-tertiary" />
            <span className="text-sm text-on-surface">客户端本地个性化训练</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-high/70 p-4">
            <FileText className="h-5 w-5 text-secondary" />
            <span className="text-sm text-on-surface">结果沉淀到实验结果页</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">下一步</p>
            <h3 className="mt-2 text-xl font-bold text-on-surface">数据与融合</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              继续查看图像 / 文本 / 协同 ID 如何进入 embedding，并在服务端形成 G1-G4 融合视图。
            </p>
          </div>
          <ArrowRight className="h-6 w-6 text-primary" />
        </div>
      </section>
    </div>
  );
};
