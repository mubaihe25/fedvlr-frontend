import React from 'react';
import {GitCompare, Trash2} from 'lucide-react';
import {cn} from '../../lib/utils';

interface CompareSelectionBasketProps {
  count: number;
  onClear: () => void;
  onOpen: () => void;
}

export const CompareSelectionBasket: React.FC<CompareSelectionBasketProps> = ({count, onClear, onOpen}) => (
  <div className="sticky bottom-4 z-30 rounded-3xl border border-cyan-200/25 bg-slate-950/90 p-3 shadow-[0_18px_60px_rgba(2,8,23,0.55)] backdrop-blur-xl">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-200/25 bg-cyan-300/10 text-cyan-100">
          <GitCompare className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-black text-white">固定对比篮</p>
          <p className="text-xs text-slate-400">已选 {count}/4，至少 2 项进入横向对比</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!count}
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-rose-200/30 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          清空
        </button>
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black transition',
            count >= 2 ? 'bg-cyan-200 text-slate-950 hover:bg-cyan-100' : 'bg-white/[0.07] text-slate-300 hover:bg-white/[0.1]',
          )}
        >
          <GitCompare className="h-4 w-4" />
          进入横向对比
        </button>
      </div>
    </div>
  </div>
);
