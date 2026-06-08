import React, {useEffect, useState} from 'react';
import {BarChart3, CheckCircle2, ClipboardList, FileText, GitCompare, Grid2X2, History, Info, ShieldCheck} from 'lucide-react';
import {ModelCapabilityMatrix} from '../components/showcase/ModelCapabilityMatrix';
import {ScenarioMetricCard} from '../components/showcase/ScenarioMetricCard';
import {useShowcaseBundle} from '../hooks/useShowcaseBundle';
import {EMPTY_VALUE, formatMetricValue, formatPercentValue, getBoundaryItems, toChineseLabel} from '../lib/showcaseFormat';
import {loadShowcaseBundle} from '../services/showcase';
import type {PageType} from '../types/common';
import type {ShowcaseReport} from '../types/showcase';

interface ResultsEvidenceProps {
  onPageChange?: (page: PageType) => void;
}

const statusLegend = [
  ['supported', '有 artifact 证据，可作为演示能力。'],
  ['partial', '有部分证据，但需要同步说明边界。'],
  ['unsupported', '当前组合暂无完整证据，不写成失败。'],
  ['future_adapter', '需要后续模型或导出适配。'],
] as const;

export const ResultsEvidence: React.FC<ResultsEvidenceProps> = ({onPageChange}) => {
  const {bundle} = useShowcaseBundle();
  const [v25Report, setV25Report] = useState<ShowcaseReport | null>(null);
  const [matrixReport, setMatrixReport] = useState<ShowcaseReport | null>(null);
  const report = bundle.report;
  const v25 = v25Report?.v25Summary ?? report.v25Summary;
  const matrix = matrixReport?.modelCapabilityMatrix ?? report.modelCapabilityMatrix;
  const boundaryItems = getBoundaryItems(report, bundle.selectedScenario);
  const targetRankText =
    typeof v25?.targetRankBefore === 'number' && typeof v25?.targetRankAfter === 'number'
      ? `${v25.targetRankBefore} -> ${v25.targetRankAfter}`
      : '170 -> 3';

  useEffect(() => {
    let active = true;
    Promise.all([
      loadShowcaseBundle('amazon_beauty_poc_v25_backend_smoke'),
      loadShowcaseBundle('model_security_capability_matrix'),
    ])
      .then(([v25Bundle, matrixBundle]) => {
        if (!active) {
          return;
        }
        setV25Report(v25Bundle.report);
        setMatrixReport(matrixBundle.report);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setV25Report(null);
        setMatrixReport(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <section className="sandbox-panel sandbox-glow rounded-[32px] p-7">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <ClipboardList className="h-3.5 w-3.5" />
              结果与证据
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">评委证据页</h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
              这里集中展示关键结果、模型能力矩阵、KU 与 Amazon 两条实验线、当前支持状态和边界说明。详细训练配置、运行监控、单次分析、横向对比和历史记录已收纳到攻防工作台。
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">
            {bundle.dataSource === 'api' ? '真实数据' : bundle.dataSource === 'mixed' ? '真实数据（部分缺失）' : 'API 未连接 / 演示数据'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ScenarioMetricCard
            label="KU 多模态主线"
            value={formatMetricValue(report.metricsSummary?.baseline?.recall50)}
            description="MMFedRAP + KU 用于展示多模态推荐主链路。"
            tone="primary"
          />
          <ScenarioMetricCard
            label="Amazon 排序推进"
            value={targetRankText}
            description="FedAvg + Amazon 单场景证据，不能泛化到所有模型。"
            tone="error"
          />
          <ScenarioMetricCard
            label="最终推荐曝光"
            value={v25?.maskedTopkHitRate === 0 ? '未命中' : formatPercentValue(v25?.maskedTopkHitRate)}
            description="masked Top50 hit 为 0 时不写成攻击成功。"
            tone="neutral"
          />
          <ScenarioMetricCard
            label="交互还原 hit@50"
            value={formatMetricValue(v25?.interactionReconstructionHit50)}
            description="以 artifact 摘要为准；缺失时显示暂无。"
            tone="secondary"
          />
          <ScenarioMetricCard
            label="成员推断 AUC"
            value={formatMetricValue(v25?.miaAuc)}
            description="代理证据，不代表所有隐私攻击场景。"
            tone="secondary"
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="sandbox-panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-cyan-100" />
            <h2 className="text-xl font-bold text-white">两条实验线</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-violet-200/20 bg-violet-200/10 p-5">
              <p className="text-lg font-bold text-violet-50">MMFedRAP + KU</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">多模态展示主模型，用于讲清图像、文本、协同信号和联邦推荐机制。</p>
            </div>
            <div className="rounded-3xl border border-rose-200/20 bg-rose-200/10 p-5">
              <p className="text-lg font-bold text-rose-50">FedAvg + Amazon</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                攻防强验证底座，可展示 target rank {targetRankText}、推荐对照、MIA、交互候选还原和安全聚合残差。
              </p>
            </div>
            <div className="rounded-3xl border border-amber-200/20 bg-amber-200/10 p-5">
              <p className="text-lg font-bold text-amber-50">证据边界</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">FedAvg Amazon 的排序推进不能泛化到所有模型；暂不支持 / 后续适配是适配边界。</p>
            </div>
          </div>
        </div>

        <div className="sandbox-panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Grid2X2 className="h-5 w-5 text-cyan-100" />
            <h2 className="text-xl font-bold text-white">能力状态说明</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {statusLegend.map(([status, desc]) => (
              <div key={status} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <p className="font-bold text-slate-50">{toChineseLabel(status)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-200/20 bg-emerald-200/10 p-4 text-sm leading-6 text-emerald-50">
            已实现 / 部分支持 / 后续适配都以 artifact 证据为准，不把演示验证、快速冒烟、代理证据写成完整实现。
          </div>
        </div>
      </section>

      <ModelCapabilityMatrix matrix={matrix} />

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="sandbox-panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-100" />
            <h2 className="text-xl font-bold text-white">当前边界说明</h2>
          </div>
          <div className="space-y-3">
            {boundaryItems.slice(0, 7).map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="sandbox-panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-3">
            <FileText className="h-5 w-5 text-cyan-100" />
            <h2 className="text-xl font-bold text-white">交付摘要</h2>
          </div>
          <div className="space-y-3 text-sm leading-6 text-slate-300">
            <p>已实现：API-first showcase 展示、联邦拓扑、攻防过程、推荐对照、能力矩阵和边界审计。</p>
            <p>可展示：KU 多模态主链路、Amazon 商品推荐、V2.5 target promotion、MIA、交互候选还原、鲁棒聚合和安全聚合模拟。</p>
            <p>未写成完整实现：formal DP、生产级安全聚合、真实视觉 embedding、所有模型泛化攻击成功。</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              {label: '单次分析', page: 'analysis' as PageType, icon: Info},
              {label: '历史实验', page: 'history' as PageType, icon: History},
              {label: '横向对比', page: 'comparison' as PageType, icon: GitCompare},
              {label: '交付页详情', page: 'deliveryReport' as PageType, icon: CheckCircle2},
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onPageChange?.(item.page)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:border-cyan-200/30 hover:text-cyan-100"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">{EMPTY_VALUE} 会用于缺失 artifact，不补假结论。</p>
        </div>
      </section>
    </div>
  );
};
