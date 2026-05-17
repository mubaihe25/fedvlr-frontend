import React from 'react';
import {ShieldCheck} from 'lucide-react';
import type {ShowcaseDefenseTrace} from '../../types/showcase';

interface DefenseTraceCardProps {
  trace?: ShowcaseDefenseTrace | null;
}

const formatValue = (value?: number | null) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '暂无 / 不适用');

const summarizeUnknown = (value: unknown) => {
  if (value === null || value === undefined || value === false) {
    return '暂无 / 不适用';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length ? value.slice(0, 4).map(String).join(' / ') : '暂无 / 不适用';
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .slice(0, 3)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join(' / ');
  }
  return '暂无 / 不适用';
};

const listValue = (items?: Array<string | number>) => (items?.length ? items.slice(0, 8).join(' / ') : '暂无 / 不适用');

export const DefenseTraceCard: React.FC<DefenseTraceCardProps> = ({trace}) => {
  if (!trace || trace.unavailable) {
    return (
      <div className="rounded-2xl border border-tertiary/20 bg-surface-container-low p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-tertiary/20 bg-tertiary/10 text-tertiary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-on-surface">防御处理摘要</h3>
            <p className="mt-1 text-xs text-on-surface-variant">暂无 / 不适用</p>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-high px-4 py-5 text-sm text-on-surface-variant">
          当前场景未提供 defense_trace 或 security matrix artifact。
        </div>
      </div>
    );
  }

  const items = [
    {label: '总客户端数', value: formatValue(trace.totalClients)},
    {label: '恶意客户端数', value: formatValue(trace.maliciousClients)},
    {label: '裁剪客户端数', value: formatValue(trace.clippedClients)},
    {label: '过滤客户端数', value: formatValue(trace.filteredClients)},
    {label: '截尾处理数', value: formatValue(trace.trimmedUpdates)},
  ];
  const methodItems = [
    {label: 'Krum selected', value: listValue(trace.krumSelected)},
    {label: 'Krum rejected', value: listValue(trace.krumRejected)},
    {label: 'trimmed_mean', value: summarizeUnknown(trace.trimmedMean)},
    {label: 'median', value: summarizeUnknown(trace.median)},
    {label: 'dp_noise', value: summarizeUnknown(trace.dpNoise)},
    {label: 'secure_agg_sim', value: summarizeUnknown(trace.secureAggSim)},
  ];

  return (
    <div className="rounded-2xl border border-tertiary/20 bg-surface-container-low p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-tertiary/20 bg-tertiary/10 text-tertiary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-on-surface">防御处理摘要</h3>
          <p className="mt-1 text-xs text-on-surface-variant">{trace.aggregationRule ?? '暂无 / 不适用'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-surface-container-high p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-tertiary">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {methodItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
            <p className="mt-2 break-words text-xs leading-5 text-on-surface">{item.value}</p>
          </div>
        ))}
      </div>

      {trace.notes?.length ? (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {trace.notes.map((note) => (
          <p key={note} className="rounded-xl bg-surface-container-high px-4 py-3 text-sm leading-6 text-on-surface">
            {note}
          </p>
          ))}
        </div>
      ) : null}

      {trace.warnings?.length ? (
        <div className="mt-5 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm leading-6 text-on-surface">
          {trace.warnings.join(' / ')}
        </div>
      ) : null}
    </div>
  );
};
