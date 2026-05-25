import React from 'react';
import {motion} from 'motion/react';
import {ImageOff} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {ShowcaseRecommendationComparison, ShowcaseRecommendationItem} from '../../types/showcase';

interface RecommendationComparisonBoardProps {
  comparison?: ShowcaseRecommendationComparison | null;
}

const columns = [
  {key: 'baseline', title: '攻击前正常推荐', tone: 'cyan', empty: '暂无基线推荐'},
  {key: 'attack', title: '攻击后无防御推荐', tone: 'rose', empty: '暂无攻击后推荐'},
  {key: 'defense', title: '防御后推荐', tone: 'emerald', empty: '暂无防御结果'},
] as const;

const toneClass = {
  cyan: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  rose: 'border-rose-300/30 bg-rose-300/10 text-rose-100',
  emerald: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
} as const;

const blockedImage = (value?: string | null) => !value || /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\');

const imageSources = (item: ShowcaseRecommendationItem) =>
  [item.localImageUrl, item.imageUrl].filter((value): value is string => !blockedImage(value));

const ProductImage: React.FC<{item: ShowcaseRecommendationItem; title: string; tone: keyof typeof toneClass}> = ({item, title, tone}) => {
  const sources = imageSources(item);
  const [sourceIndex, setSourceIndex] = React.useState(0);
  const source = sources[sourceIndex];

  if (source) {
    return (
      <img
        className="h-20 w-20 rounded-2xl object-cover"
        src={source}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setSourceIndex((index) => index + 1)}
      />
    );
  }

  return (
    <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl border', toneClass[tone])}>
      <ImageOff className="h-6 w-6" />
    </div>
  );
};

const getTitle = (item: ShowcaseRecommendationItem) => item.title ?? (item.itemId ? `商品 ${item.itemId}` : '未命名商品');

export const RecommendationComparisonBoard: React.FC<RecommendationComparisonBoardProps> = ({comparison}) => (
  <section className="sandbox-panel sandbox-glow rounded-[28px] p-5">
    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/80">Recommendation Contrast</p>
        <h3 className="mt-1 text-xl font-bold text-white">三列推荐商品对照</h3>
      </div>
      <p className="text-xs text-slate-400">每列最多展示 6 个商品，score 为空时不显示假分数。</p>
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {columns.map((column) => {
        const items = (comparison?.[column.key] ?? []).slice(0, 6);
        return (
          <div key={column.key} className="rounded-3xl border border-slate-700/50 bg-slate-950/45 p-4">
            <div className={cn('mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold', toneClass[column.tone])}>{column.title}</div>
            <div className="space-y-3">
              {items.length ? (
                items.map((item, index) => {
                  const title = getTitle(item);
                  return (
                    <motion.div
                      key={`${column.key}-${item.itemId ?? index}-${item.rank ?? index}`}
                      className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/55 p-3"
                      initial={{opacity: 0, x: column.key === 'attack' ? 24 : -24}}
                      animate={{opacity: 1, x: 0}}
                      transition={{delay: index * 0.07, type: 'spring', stiffness: 160, damping: 22}}
                      whileHover={{scale: 1.015}}
                    >
                      <ProductImage item={item} title={title} tone={column.tone} />
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold', toneClass[column.tone])}>
                            rank #{item.rank ?? index + 1}
                          </span>
                          {item.itemId ? <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">{item.itemId}</span> : null}
                        </div>
                        <h4 className="line-clamp-2 text-sm font-bold leading-5 text-slate-50">{title}</h4>
                        {item.category ? <p className="mt-1 text-[11px] text-slate-400">{item.category}</p> : null}
                        {typeof item.score === 'number' && Number.isFinite(item.score) ? (
                          <p className="mt-2 font-mono text-xs text-slate-300">score {item.score.toFixed(3)}</p>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-700/40 bg-slate-900/45 px-4 py-6 text-sm text-slate-400">
                  {column.empty}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </section>
);
