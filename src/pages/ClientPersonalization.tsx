import React, {useMemo, useState} from 'react';
import {Activity, ArrowRight, Database, Info, Layers, Lock, Server, TrendingUp, Upload, Users} from 'lucide-react';
import {ModalityWeightBar} from '../components/showcase/ModalityWeightBar';
import {ShowcasePageHeader} from '../components/showcase/ShowcasePageHeader';
import {cn} from '../lib/utils';
import {clientCases, federatedBoundary, serverViews, showcaseSampleNotice, type ServerViewId} from '../mock/showcase';

const viewTone: Record<ServerViewId, 'primary' | 'secondary' | 'tertiary' | 'error'> = {
  G1: 'primary',
  G2: 'secondary',
  G3: 'tertiary',
  G4: 'error',
};

const modalityBadgeClasses: Record<string, string> = {
  图像: 'bg-primary/10 text-primary',
  文本: 'bg-secondary/10 text-secondary',
  '协同 ID': 'bg-tertiary/10 text-tertiary',
};

export const ClientPersonalization: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState(clientCases[0]?.clientId ?? '');
  const selectedClient = clientCases.find((client) => client.clientId === selectedClientId) ?? clientCases[0];

  const routerItems = useMemo(
    () =>
      (Object.entries(selectedClient.routerWeights) as Array<[ServerViewId, number]>).map(([viewId, value]) => {
        const view = serverViews.find((item) => item.id === viewId);
        return {
          key: viewId,
          label: `${viewId} ${view?.name.replace('解释视图', '') ?? ''}`,
          value,
          tone: viewTone[viewId],
        };
      }),
    [selectedClient.routerWeights],
  );

  return (
    <div className="space-y-8 pb-12">
      <ShowcasePageHeader
        eyebrow="选拔赛展示链路"
        title="客户端个性化路由"
        description="展示客户端如何基于本地交互历史，对服务端多视图进行个性化加权。"
        chips={['本地历史不直接上传', '个性化表示 = Σ router_weight × server_view', '不同客户端产生不同 Top-K 推荐']}
        icon={Users}
        tone="tertiary"
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {clientCases.map((client) => {
          const isSelected = client.clientId === selectedClient.clientId;

          return (
            <button
              key={client.clientId}
              onClick={() => setSelectedClientId(client.clientId)}
              className={cn(
                'rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5',
                isSelected
                  ? 'border-tertiary/30 bg-tertiary/10 text-tertiary'
                  : 'border-outline-variant/10 bg-surface-container-low text-on-surface hover:border-tertiary/20',
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-bold">{client.clientId}</span>
                <Activity className="h-4 w-4" />
              </div>
              <p className="text-sm leading-6 text-on-surface-variant">{client.profileHint}</p>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(280px,0.9fr)_minmax(340px,1fr)_minmax(360px,1fr)]">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="mb-5 flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold text-on-surface">本地历史</h3>
          </div>
          <div className="mb-5 rounded-xl border border-primary/10 bg-primary/10 p-4">
            <p className="font-mono text-sm font-bold text-primary">{selectedClient.clientId}</p>
            <p className="mt-2 text-sm leading-6 text-on-surface">{selectedClient.profileHint}</p>
          </div>
          <div className="space-y-3">
            {selectedClient.localHistory.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-surface-container-high px-4 py-3">
                <span className="font-mono text-xs text-primary">H{index + 1}</span>
                <span className="text-sm text-on-surface">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-tertiary/20 bg-tertiary/10 px-4 py-3 text-sm text-on-surface">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
            <p>用户原始交互历史不直接上传，主要用于本地 router 权重和个性化表示计算。</p>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="mb-5 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-tertiary" />
            <h3 className="text-xl font-bold text-on-surface">Router 权重</h3>
          </div>
          <ModalityWeightBar items={routerItems} />
          <div className="mt-6 rounded-xl border border-outline-variant/10 bg-surface-container-high p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">个性化融合公式</p>
            <p className="font-mono text-sm leading-7 text-primary">
              personalized_representation = Σ router_weight × server_view
            </p>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              同一组服务端 G1-G4 视图会被不同客户端赋予不同权重，因此推荐输出随本地历史而变化。
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {serverViews.map((view) => (
              <div key={view.id} className="rounded-xl bg-surface-container-high px-4 py-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-on-surface">{view.id}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px]', viewTone[view.id] === 'error' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary')}>
                    {Math.round(selectedClient.routerWeights[view.id] * 100)}%
                  </span>
                </div>
                <p className="text-xs leading-5 text-on-surface-variant">{view.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="mb-5 flex items-center gap-3">
            <Layers className="h-5 w-5 text-secondary" />
            <h3 className="text-xl font-bold text-on-surface">个性化推荐列表</h3>
          </div>
          <div className="space-y-4">
            {selectedClient.recommendationList.map((recommendation, index) => (
              <div key={recommendation.title} className="rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-primary">Top {index + 1}</p>
                    <h4 className="mt-1 font-bold text-on-surface">{recommendation.title}</h4>
                  </div>
                  <span className="rounded-full bg-surface-container-highest px-3 py-1 font-mono text-xs text-tertiary">
                    {recommendation.score.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm leading-6 text-on-surface-variant">{recommendation.reason}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">主导信号</span>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', modalityBadgeClasses[recommendation.mainModality] ?? 'bg-primary/10 text-primary')}>
                    {recommendation.mainModality}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-[#0c141b] p-6">
        <div className="mb-5 flex items-center gap-3">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-on-surface">联邦边界说明</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-surface-container-high p-5">
            <div className="mb-4 flex items-center gap-2 text-tertiary">
              <Lock className="h-4 w-4" />
              <h4 className="font-bold">本地保留</h4>
            </div>
            <div className="space-y-2">
              {federatedBoundary.localKept.map((item) => (
                <p key={item} className="rounded-lg bg-surface-container-highest px-3 py-2 text-sm text-on-surface">{item}</p>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-surface-container-high p-5">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Upload className="h-4 w-4" />
              <h4 className="font-bold">上传给服务端</h4>
            </div>
            <div className="space-y-2">
              {federatedBoundary.uploaded.map((item) => (
                <p key={item} className="rounded-lg bg-surface-container-highest px-3 py-2 text-sm text-on-surface">{item}</p>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-surface-container-high p-5">
            <div className="mb-4 flex items-center gap-2 text-secondary">
              <Server className="h-4 w-4" />
              <h4 className="font-bold">服务端聚合</h4>
            </div>
            <div className="space-y-2">
              {federatedBoundary.serverAggregates.map((item) => (
                <p key={item} className="rounded-lg bg-surface-container-highest px-3 py-2 text-sm text-on-surface">{item}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-on-surface">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>客户端个性化展示强调本地数据不直接上传；服务端接收共享更新、风险观测指标和必要训练统计，用于聚合和下一轮下发。{showcaseSampleNotice}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">下一步</p>
            <h3 className="mt-2 text-xl font-bold text-on-surface">攻防靶场</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              继续查看投毒攻击如何造成推荐偏移，以及鲁棒防御如何削弱异常更新影响。
            </p>
          </div>
          <ArrowRight className="h-6 w-6 text-primary" />
        </div>
      </section>
    </div>
  );
};
