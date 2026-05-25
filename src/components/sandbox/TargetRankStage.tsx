import React from 'react';
import {motion} from 'motion/react';
import {AlertTriangle, Target} from 'lucide-react';
import {EMPTY_VALUE, formatMetricValue, formatPercentValue} from '../../lib/showcaseFormat';
import type {ShowcaseReport} from '../../types/showcase';

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
    <section className="sandbox-panel rounded-[24px] p-5">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-200/30 bg-rose-200/10 px-3 py-1 text-xs font-bold text-rose-100">
            <Target className="h-3.5 w-3.5" />
            目标排序推进
          </div>
          <h3 className="text-xl font-bold text-white">
            未屏蔽排序 {rankBefore} -&gt; {rankAfter}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            rank 前移表示目标商品在未屏蔽排序中更靠前，但最终推荐曝光仍以 masked Top50 命中为准。
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-right">
          <p className="text-xs text-slate-400">最终 Top50 曝光</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{maskedHitRate === 0 ? '未命中' : formatPercentValue(maskedHitRate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(240px,0.74fr)_minmax(0,1.26fr)]">
        <motion.div
          className="rounded-2xl border border-rose-200/25 bg-rose-200/10 p-5"
          initial={{x: 24, opacity: 0.5}}
          animate={{x: 0, opacity: 1}}
          transition={{duration: 0.7, repeat: Infinity, repeatType: 'mirror', repeatDelay: 2.6}}
        >
          <p className="text-xs font-bold tracking-[0.2em] text-rose-100">目标商品</p>
          <h4 className="mt-3 line-clamp-3 text-lg font-bold leading-6 text-white">{productTitle}</h4>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950/35 px-3 py-3">
              <p className="text-[11px] text-slate-400">排序前</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-100">#{rankBefore}</p>
            </div>
            <div className="rounded-xl bg-rose-200/10 px-3 py-3">
              <p className="text-[11px] text-rose-100">排序后</p>
              <p className="mt-1 font-mono text-2xl font-bold text-rose-100">#{rankAfter}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">score gain：{formatMetricValue(scoreGain)}</p>
        </motion.div>

        <div className="relative min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-800/80">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-300 via-amber-200 to-sky-200"
              initial={{width: '14%'}}
              animate={{width: '92%'}}
              transition={{duration: 2.2, repeat: Infinity, repeatType: 'mirror', repeatDelay: 1.5}}
            />
          </div>
          <div className="relative z-10 flex h-full min-h-[180px] items-center justify-between">
            <div className="rounded-2xl border border-white/10 bg-slate-900/65 px-4 py-3 text-center">
              <p className="text-xs text-slate-400">起始排序</p>
              <p className="mt-2 font-mono text-3xl font-bold text-slate-100">#{rankBefore}</p>
            </div>
            <motion.div
              className="rounded-full border border-rose-200/55 bg-rose-200/16 p-4 text-rose-50 shadow-[0_0_28px_rgba(251,113,133,0.24)]"
              animate={{x: [-90, 90], scale: [0.94, 1.06, 0.94]}}
              transition={{duration: 2.2, repeat: Infinity, repeatType: 'mirror', repeatDelay: 1.5}}
            >
              <Target className="h-8 w-8" />
            </motion.div>
            <div className="rounded-2xl border border-sky-200/25 bg-sky-200/10 px-4 py-3 text-center">
              <p className="text-xs text-sky-100">推进后排序</p>
              <p className="mt-2 font-mono text-3xl font-bold text-sky-50">#{rankAfter}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200/25 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-50">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            <p>最终推荐列表命中：{maskedHitRate === 0 ? '0%，未命中' : formatPercentValue(maskedHitRate)}。rank 前移不等于进入 Top50，不能写成攻击成功。</p>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">证据来源：{v25 ? 'V2.5 后端冒烟证据' : EMPTY_VALUE}</p>
        </div>
      </div>
    </section>
  );
};
