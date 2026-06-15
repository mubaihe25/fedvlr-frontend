import React from 'react';
import {motion} from 'motion/react';
import {ImageOff, Target, TrendingDown, TrendingUp} from 'lucide-react';
import {cn} from '../../lib/utils';
import {normalizeShowcaseDataset} from '../../lib/scenarioNarratives';
import type {ShowcaseRecommendationItem} from '../../types/showcase';

export type RecommendationTone = 'cyan' | 'rose' | 'emerald';
export type RecommendationChangeStatus = '新增' | '上升' | '下降' | '保持';

const toneClass: Record<RecommendationTone, string> = {
  cyan: 'border-sky-200/30 bg-sky-200/10 text-sky-100',
  rose: 'border-rose-200/30 bg-rose-200/10 text-rose-100',
  emerald: 'border-emerald-200/30 bg-emerald-200/10 text-emerald-100',
};

const changeToneClass: Record<RecommendationChangeStatus, string> = {
  新增: 'border-violet-200/30 bg-violet-300/10 text-violet-100',
  上升: 'border-emerald-200/30 bg-emerald-300/10 text-emerald-100',
  下降: 'border-amber-200/30 bg-amber-300/10 text-amber-100',
  保持: 'border-slate-200/20 bg-slate-300/10 text-slate-200',
};

const blockedImage = (value?: string | null) => !value || /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\');

const imageSources = (item: ShowcaseRecommendationItem, dataset?: string | null) => {
  const direct = [item.thumbnailUrl, item.localImageUrl, item.imageUrl].filter((value): value is string => !blockedImage(value));
  if (direct.length) return direct;
  const datasetId = normalizeShowcaseDataset(dataset);
  const itemId = item.itemId === undefined || item.itemId === null ? '' : String(item.itemId).trim();
  if (!datasetId || !itemId || blockedImage(datasetId) || blockedImage(itemId)) return [];
  return [`/api/showcase/images/${encodeURIComponent(datasetId)}/${encodeURIComponent(itemId)}?size=thumb`];
};

const ProductImage: React.FC<{item: ShowcaseRecommendationItem; title: string; tone: RecommendationTone; dataset?: string | null}> = ({item, title, tone, dataset}) => {
  const sources = imageSources(item, dataset);
  const [sourceIndex, setSourceIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const source = sources[sourceIndex];

  React.useEffect(() => {
    setSourceIndex(0);
    setLoaded(false);
  }, [item.itemId, item.thumbnailUrl, item.localImageUrl, item.imageUrl, dataset]);

  if (!source) {
    return <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl border', toneClass[tone])}><ImageOff className="h-6 w-6" /></div>;
  }

  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-800/70">
      {!loaded ? <div className="absolute inset-0 animate-pulse bg-slate-700/70" /> : null}
      <img
        className={cn('h-20 w-20 object-cover transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
        src={source}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setSourceIndex((index) => index + 1);
        }}
      />
    </div>
  );
};

const ChangeBadge: React.FC<{status: RecommendationChangeStatus}> = ({status}) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold', changeToneClass[status])}>
    {status === '上升' ? <TrendingUp className="h-3 w-3" /> : null}
    {status === '下降' ? <TrendingDown className="h-3 w-3" /> : null}
    {status}
  </span>
);

interface RecommendationProductCardProps {
  item: ShowcaseRecommendationItem;
  title: string;
  tone: RecommendationTone;
  dataset?: string | null;
  changeStatus: RecommendationChangeStatus;
  isTarget: boolean;
  index: number;
  cardKey: string;
}

export const RecommendationProductCard: React.FC<RecommendationProductCardProps> = ({item, title, tone, dataset, changeStatus, isTarget, index, cardKey}) => (
  <motion.div
    key={cardKey}
    className={cn('grid grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-2xl border analysis-item p-3', isTarget ? 'border-rose-300/50 shadow-[0_0_22px_rgba(244,63,94,0.18)]' : 'border-white/10')}
    initial={{opacity: 0, y: 18}}
    animate={{opacity: 1, y: 0}}
    transition={{delay: index * 0.05, type: 'spring', stiffness: 160, damping: 22}}
    whileHover={{scale: 1.012}}
  >
    <ProductImage item={item} title={title} tone={tone} dataset={dataset} />
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold', toneClass[tone])}>rank #{item.rank ?? index + 1}</span>
        <ChangeBadge status={changeStatus} />
        {isTarget ? <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/40 bg-rose-400/15 px-2 py-0.5 text-[11px] font-bold text-rose-100"><Target className="h-3 w-3" />目标商品</span> : null}
      </div>
      <h4 className="line-clamp-2 text-sm font-bold leading-5 text-slate-50">{title}</h4>
      {item.category ? <p className="mt-1 text-[11px] text-slate-400">{item.category}</p> : null}
      {typeof item.score === 'number' && Number.isFinite(item.score) ? <p className="mt-2 font-mono text-xs text-slate-300">分数 {item.score.toFixed(3)}</p> : null}
    </div>
  </motion.div>
);
