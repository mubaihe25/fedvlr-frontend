import React from 'react';
import {motion} from 'motion/react';
import {ImageOff} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {ShowcaseRecommendationComparison, ShowcaseRecommendationItem} from '../../types/showcase';

interface RecommendationComparisonBoardProps {
  comparison?: ShowcaseRecommendationComparison | null;
}

const columns = [
  {key: 'baseline', title: '正常推荐', tone: 'cyan', empty: '暂无正常推荐'},
  {key: 'attack', title: '攻击后推荐', tone: 'rose', empty: '暂无攻击后推荐'},
  {key: 'defense', title: '防御后推荐 / 暂无防御', tone: 'emerald', empty: '暂无防御结果'},
] as const;

const toneClass = {
  cyan: 'border-sky-200/30 bg-sky-200/10 text-sky-100',
  rose: 'border-rose-200/30 bg-rose-200/10 text-rose-100',
  emerald: 'border-emerald-200/30 bg-emerald-200/10 text-emerald-100',
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
        <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">推荐对照</p>
        <h3 className="mt-1 text-xl font-bold text-white">三列推荐商品变化</h3>
      </div>
      <p className="text-xs text-slate-400">每列最多展示 5 个商品；优先 local_image_url，其次 image_url，最后占位图；score 为空不显示。</p>
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {columns.map((column) => {
        const items = (comparison?.[column.key] ?? []).slice(0, 5);
        return (
          <div key={column.key} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            <div className={cn('mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold', toneClass[column.tone])}>{column.title}</div>
            <div className="space-y-3">
              {items.length ? (
                items.map((item, index) => {
                  const title = getTitle(item);
                  return (
                    <motion.div
                      key={`${column.key}-${item.itemId ?? index}-${item.rank ?? index}`}
                      className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-2xl border border-white/10 bg-slate-900/35 p-3"
                      initial={{opacity: 0, y: 18}}
                      animate={{opacity: 1, y: 0}}
                      transition={{delay: index * 0.07, type: 'spring', stiffness: 160, damping: 22}}
                      whileHover={{scale: 1.012}}
                    >
                      <ProductImage item={item} title={title} tone={column.tone} />
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold', toneClass[column.tone])}>
                            rank #{item.rank ?? index + 1}
                          </span>
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
                <div className="rounded-2xl border border-white/10 bg-slate-900/25 px-4 py-6 text-sm text-slate-400">
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
