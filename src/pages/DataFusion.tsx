import React from 'react';
import {Database, FileText, Image, Info, Layers, Network} from 'lucide-react';

const signalCards = [
  {
    title: '数据样本',
    description: '展示推荐数据样本、用户交互和物品侧多模态信息入口。',
    icon: Database,
    tone: 'text-primary bg-primary/10 border-primary/20',
  },
  {
    title: '图像 embedding',
    description: '占位展示视觉特征向量，用于后续接入图像模态 artifact。',
    icon: Image,
    tone: 'text-secondary bg-secondary/10 border-secondary/20',
  },
  {
    title: '文本 embedding',
    description: '占位展示标题、描述等语义特征向量。',
    icon: FileText,
    tone: 'text-tertiary bg-tertiary/10 border-tertiary/20',
  },
  {
    title: '协同 ID embedding',
    description: '占位展示用户-物品交互信号与协同过滤表示。',
    icon: Network,
    tone: 'text-primary bg-primary/10 border-primary/20',
  },
];

const fusionViews = [
  {name: 'G1', label: '视觉增强视图', description: '突出图像模态偏好线索。'},
  {name: 'G2', label: '文本增强视图', description: '突出语义描述与文本相关性。'},
  {name: 'G3', label: '协同增强视图', description: '突出用户交互与协同 ID 信号。'},
  {name: 'G4', label: '综合融合视图', description: '汇总多模态信息，形成服务端预融合表示。'},
];

export const DataFusion: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Layers className="h-3.5 w-3.5" />
          多模态输入与服务端融合
        </div>
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">数据与多模态融合</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-on-surface-variant">
          展示数据集、图像/文本/协同 ID 三类信号，以及服务端多视图融合生成过程。当前页面用于选拔赛展示结构占位，
          后续接入 showcase artifacts 后替换为真实样本、embedding 摘要和融合视图证据。
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {signalCards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${card.tone}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div className="mb-6 flex items-center gap-3">
          <Network className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-on-surface">服务端融合视图 G1-G4</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {fusionViews.map((view) => (
            <div key={view.name} className="rounded-xl border border-primary/10 bg-surface-container-high p-5">
              <div className="mb-3 font-mono text-2xl font-bold text-primary">{view.name}</div>
              <h4 className="font-bold text-on-surface">{view.label}</h4>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{view.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-on-surface">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>当前为展示结构占位，后续接入 showcase artifacts。</p>
      </div>
    </div>
  );
};
