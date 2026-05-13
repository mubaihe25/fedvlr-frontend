import React from 'react';
import {ArrowRight, CheckCircle2, Database, FileText, Image, Info, Layers, Network} from 'lucide-react';
import {ModalityWeightBar} from '../components/showcase/ModalityWeightBar';
import {VectorPreview} from '../components/showcase/VectorPreview';
import {cn} from '../lib/utils';
import {datasetProfile, modalityEmbeddings, sampleItems, serverViews, type ModalityKey} from '../mock/showcase';

const modalityLabels: Record<ModalityKey, string> = {
  image: '图像',
  text: '文本',
  collaborative_id: '协同 ID',
};

const modalityTone: Record<ModalityKey, 'primary' | 'secondary' | 'tertiary'> = {
  image: 'primary',
  text: 'secondary',
  collaborative_id: 'tertiary',
};

const modalityWeightItems = (weights: Record<ModalityKey, number>) => [
  {key: 'image', label: '图像', value: weights.image, tone: 'primary' as const},
  {key: 'text', label: '文本', value: weights.text, tone: 'secondary' as const},
  {key: 'collaborative_id', label: '协同 ID', value: weights.collaborative_id, tone: 'tertiary' as const},
];

const flowSteps = ['物品样本', '多模态 embedding', '服务端融合视图', '下发给客户端路由使用'];

const typeLabels = {
  short_video: '短视频',
  product: '商品',
  content: '内容',
} as const;

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
          展示用户交互、物品图像/文本/协同 ID 如何转化为多模态表征，并在服务端形成多个可供客户端选择的融合视图。
          这里不是简单拼接三类特征，而是先构造不同解释视角的服务端视图，再交给客户端个性化路由使用。
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {[
          {label: '数据集', value: datasetProfile.name},
          {label: '用户数', value: datasetProfile.users},
          {label: '物品数', value: datasetProfile.items},
          {label: '交互数', value: datasetProfile.interactions},
          {label: '稀疏度', value: datasetProfile.sparsity},
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{metric.label}</p>
            <p className="mt-3 text-xl font-bold text-on-surface">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold text-on-surface">{datasetProfile.source}</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{datasetProfile.note}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {datasetProfile.modalities.map((modality) => (
              <span key={modality} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {modalityLabels[modality]}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)_minmax(360px,0.9fr)]">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="mb-5 flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold text-on-surface">样本物品</h3>
          </div>
          <div className="space-y-4">
            {sampleItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4">
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4">
                  <div className={cn('flex h-24 items-end rounded-xl bg-gradient-to-br p-3', item.thumbnailGradient)}>
                    <span className="rounded bg-black/35 px-2 py-1 font-mono text-[10px] text-on-surface">{item.id}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-on-surface">{item.title}</h4>
                      <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-[10px] text-on-surface-variant">
                        {typeLabels[item.type]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-on-surface-variant">{item.text}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(Object.keys(item.modalityStatus) as ModalityKey[]).map((modality) => (
                    <div key={modality} className="flex items-center gap-2 rounded-lg bg-surface-container-highest px-3 py-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-tertiary" />
                      <span className="text-on-surface-variant">{modalityLabels[modality]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="mb-5 flex items-center gap-3">
            <Image className="h-5 w-5 text-secondary" />
            <h3 className="text-xl font-bold text-on-surface">三类 embedding</h3>
          </div>
          <div className="space-y-4">
            {modalityEmbeddings.map((embedding) => (
              <div key={embedding.modality} className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-on-surface">{embedding.label}</h4>
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant">{embedding.description}</p>
                  </div>
                  <span className="rounded-full bg-surface-container-highest px-2 py-1 font-mono text-[10px] text-on-surface-variant">
                    dim preview
                  </span>
                </div>
                <VectorPreview values={embedding.vector} tone={modalityTone[embedding.modality]} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="mb-5 flex items-center gap-3">
            <Network className="h-5 w-5 text-tertiary" />
            <h3 className="text-xl font-bold text-on-surface">服务端多视图</h3>
          </div>
          <div className="space-y-4">
            {serverViews.map((view) => (
              <div key={view.id} className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-lg font-bold text-primary">{view.id}</p>
                    <h4 className="font-bold text-on-surface">{view.name}</h4>
                  </div>
                  <Layers className="h-5 w-5 text-primary/70" />
                </div>
                <p className="mb-4 text-xs leading-5 text-on-surface-variant">{view.description}</p>
                <ModalityWeightBar items={modalityWeightItems(view.modalityWeights)} compact />
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">代表相似物品</p>
                  <div className="flex flex-wrap gap-1.5">
                    {view.sampleSimilarItems.map((item) => (
                      <span key={item} className="rounded-full bg-surface-container-highest px-2 py-1 text-[11px] text-on-surface">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-[#0c141b] p-6">
        <div className="mb-5 flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-on-surface">流程解释</h3>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {flowSteps.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex-1 rounded-xl border border-outline-variant/10 bg-surface-container-high px-5 py-4 text-center text-sm font-semibold text-on-surface">
                {step}
              </div>
              {index < flowSteps.length - 1 ? (
                <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-primary lg:rotate-0" />
              ) : null}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-on-surface">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>当前页面展示结构可替换真实数据集样本；后续接入 showcase artifacts 后，可用真实图片、文本和融合视图证据替换占位内容。</p>
        </div>
      </section>
    </div>
  );
};
