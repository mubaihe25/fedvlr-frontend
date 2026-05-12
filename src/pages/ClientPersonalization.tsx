import React from 'react';
import {Activity, FileText, Info, Layers, TrendingUp} from 'lucide-react';

const personalizationCards = [
  {
    title: '客户端本地交互历史',
    description: '占位展示客户端本地点击、浏览、评分或收藏序列。',
    icon: Activity,
  },
  {
    title: 'View G1/G2/G3/G4 权重',
    description: '占位展示本地 router 对四个服务端融合视图的偏好分配。',
    icon: TrendingUp,
  },
  {
    title: '个性化融合表示',
    description: '占位展示客户端根据本地历史生成的个性化多模态表示。',
    icon: Layers,
  },
  {
    title: 'Top-K 推荐列表',
    description: '占位展示个性化融合后输出的候选推荐结果。',
    icon: FileText,
  },
];

const viewWeights = [
  {label: 'G1', value: '32%', tone: 'bg-primary'},
  {label: 'G2', value: '21%', tone: 'bg-secondary'},
  {label: 'G3', value: '29%', tone: 'bg-tertiary'},
  {label: 'G4', value: '18%', tone: 'bg-error'},
];

export const ClientPersonalization: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 text-xs font-bold text-tertiary">
          <Activity className="h-3.5 w-3.5" />
          本地偏好建模
        </div>
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">客户端个性化</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-on-surface-variant">
          展示客户端本地历史、router 权重、个性化融合表示和推荐列表。当前页面先承载展示骨架，
          后续接入客户端路由权重和真实推荐结果。
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {personalizationCards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-tertiary/20 bg-tertiary/10 text-tertiary">
              <card.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <h3 className="mb-5 text-xl font-bold text-on-surface">View 权重占位</h3>
          <div className="space-y-4">
            {viewWeights.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-mono font-bold text-on-surface">{item.label}</span>
                  <span className="text-on-surface-variant">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-highest">
                  <div className={`h-2 rounded-full ${item.tone}`} style={{width: item.value}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <h3 className="mb-5 text-xl font-bold text-on-surface">Top-K 推荐列表</h3>
          <div className="space-y-3">
            {['Item-042', 'Item-117', 'Item-203', 'Item-318', 'Item-429'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-xl bg-surface-container-high px-4 py-3">
                <span className="font-mono text-sm text-primary">#{index + 1}</span>
                <span className="text-sm font-semibold text-on-surface">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-tertiary/20 bg-tertiary/10 px-5 py-4 text-sm text-on-surface">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
        <p>当前为展示结构占位，后续接入客户端路由权重和推荐结果。</p>
      </div>
    </div>
  );
};
