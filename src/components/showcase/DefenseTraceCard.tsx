import React from 'react';
import {ShieldCheck} from 'lucide-react';
import type {DefenseTrace} from '../../mock/showcase';

interface DefenseTraceCardProps {
  trace: DefenseTrace;
}

export const DefenseTraceCard: React.FC<DefenseTraceCardProps> = ({trace}) => {
  const items = [
    {label: '总客户端数', value: trace.totalClients},
    {label: '恶意客户端数', value: trace.maliciousClients},
    {label: '裁剪客户端数', value: trace.clippedClients},
    {label: '过滤客户端数', value: trace.filteredClients},
    {label: '截尾处理数', value: trace.trimmedUpdates},
  ];

  return (
    <div className="rounded-2xl border border-tertiary/20 bg-surface-container-low p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-tertiary/20 bg-tertiary/10 text-tertiary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-on-surface">防御处理摘要</h3>
          <p className="mt-1 text-xs text-on-surface-variant">{trace.aggregationRule}</p>
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
        {trace.notes.map((note) => (
          <p key={note} className="rounded-xl bg-surface-container-high px-4 py-3 text-sm leading-6 text-on-surface">
            {note}
          </p>
        ))}
      </div>
    </div>
  );
};
