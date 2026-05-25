import React from 'react';
import {motion} from 'motion/react';
import {AlertTriangle, Target} from 'lucide-react';
import type {ShowcaseReport} from '../../types/showcase';
import {EMPTY_VALUE, formatMetricValue, formatPercentValue} from '../../lib/showcaseFormat';

interface TargetRankStageProps {
  report: ShowcaseReport;
}

export const TargetRankStage: React.FC<TargetRankStageProps> = ({report}) => {
  const v25 = report.v25Summary;
  const firstEntry = report.targetRankSummary?.entries?.[0];
  const rankBefore = v25?.targetRankBefore ?? firstEntry?.baselineRank ?? 170;
  const rankAfter = v25?.targetRankAfter ?? firstEntry?.attackRank ?? 3;
  const scoreGain = v25?.scoreGain ?? firstEntry?.scoreGain;
  const maskedHitRate = v25?.maskedTopkHitRate ?? report.metricsSummary?.targetHitRate ?? 0;
  const productTitle = firstEntry?.title ?? '目标商品';

  return (
    <section className="sandbox-panel sandbox-glow rounded-[24px] p-5">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs font-bold text-rose-100">
            <Target className="h-3.5 w-3.5" />
            目标排序推进
          </div>
          <h3 className="text-xl font-bold text-white">
            未屏蔽排序 {rankBefore} -&gt; {rankAfter}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            这是 target promotion V2.5 的排序诊断动画。rank 前移表示目标项在未屏蔽排序中靠前，但最终 Top50 曝光仍以 masked TopK 命中为准。
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 px-4 py-3 text-right">
          <p className="text-xs text-slate-400">最终 Top50 曝光</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{maskedHitRate === 0 ? '未命中' : formatPercentValue(maskedHitRate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)]">
        <motion.div
          className="rounded-2xl border border-rose-300/30 bg-gradient-to-br from-rose-500/15 to-slate-950/80 p-5"
          initial={{x: 40, opacity: 0.4}}
          animate={{x: 0, opacity: 1}}
          transition={{duration: 0.75, repeat: Infinity, repeatType: 'mirror', repeatDelay: 2.6}}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-200">Target Item</p>
          <h4 className="mt-3 line-clamp-3 text-lg font-bold leading-6 text-white">{productTitle}</h4>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950/60 px-3 py-3">
              <p className="text-[11px] text-slate-400">排序前</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-100">#{rankBefore}</p>
            </div>
            <div className="rounded-xl bg-rose-300/10 px-3 py-3">
              <p className="text-[11px] text-rose-100">排序后</p>
              <p className="mt-1 font-mono text-2xl font-bold text-rose-100">#{rankAfter}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">score gain：{formatMetricValue(scoreGain)}</p>
        </motion.div>

        <div className="relative min-h-[220px] rounded-2xl border border-slate-700/50 bg-slate-950/55 p-5">
          <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300"
              initial={{width: '14%'}}
              animate={{width: '92%'}}
              transition={{duration: 2.2, repeat: Infinity, repeatType: 'mirror', repeatDelay: 1.5}}
            />
          </div>
          <div className="relative z-10 flex h-full min-h-[180px] items-center justify-between">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-center">
              <p className="text-xs text-slate-400">起始未屏蔽排序</p>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-100">#{rankBefore}</p>
            </div>
            <motion.div
              className="rounded-full border border-rose-300/60 bg-rose-400/20 p-4 text-rose-50 shadow-[0_0_32px_rgba(251,113,133,0.35)]"
              animate={{x: [-120, 120], scale: [0.92, 1.08, 0.92]}}
              transition={{duration: 2.2, repeat: Infinity, repeatType: 'mirror', repeatDelay: 1.5}}
            >
              <Target className="h-8 w-8" />
            </motion.div>
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-center">
              <p className="text-xs text-cyan-100">推进后未屏蔽排序</p>
              <p className="mt-2 font-mono text-3xl font-bold text-cyan-50">#{rankAfter}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            <p>最终推荐列表命中：{maskedHitRate === 0 ? '0%，未命中' : formatPercentValue(maskedHitRate)}。rank 前移不等于进入 Top50，不能写成攻击成功。</p>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">artifact 摘要：{v25 ? 'V2.5 backend smoke' : EMPTY_VALUE}</p>
        </div>
      </div>
    </section>
  );
};
