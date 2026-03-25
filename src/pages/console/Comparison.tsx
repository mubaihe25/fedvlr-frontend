import React from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Layers, ArrowLeftRight, ArrowRight, CheckCircle2, XCircle, MinusCircle, Info, Table, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

const comparisonData = [
  { name: 'Baseline', recall: 0.92, ndcg: 0.85, loss: 0.12 },
  { name: 'Attack', recall: 0.65, ndcg: 0.52, loss: 0.45 },
  { name: 'Defense', recall: 0.94, ndcg: 0.88, loss: 0.14 },
];

export const Comparison: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-2 block">Multi-Experiment Benchmarking</span>
          <h3 className="text-4xl font-headline font-bold text-on-background tracking-tight">对比分析 (优化版)</h3>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-2">
            <Layers className="w-4 h-4" />
            选择实验组
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '基线组 (Baseline)', status: 'Optimal', color: 'on-surface-variant', value: '92.1%', icon: CheckCircle2 },
          { label: '攻击组 (Label Flip)', status: 'Degraded', color: 'error', value: '65.4%', icon: XCircle },
          { label: '防御组 (Cyber-Shield)', status: 'Restored', color: 'tertiary', value: '94.2%', icon: ShieldCheck },
        ].map((group, i) => (
          <div key={group.label} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className={cn("absolute top-0 left-0 w-1 h-full", i === 0 ? "bg-on-surface-variant" : i === 1 ? "bg-error" : "bg-tertiary")} />
            <div className="flex justify-between items-start mb-4">
              <group.icon className={cn("w-6 h-6", i === 0 ? "text-on-surface-variant" : i === 1 ? "text-error" : "text-tertiary")} />
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider", i === 0 ? "bg-on-surface-variant/10 text-on-surface-variant" : i === 1 ? "bg-error/10 text-error" : "bg-tertiary/10 text-tertiary")}>
                {group.status}
              </span>
            </div>
            <h4 className="text-sm font-bold text-on-surface-variant mb-1">{group.label}</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-on-surface">{group.value}</span>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Recall@10</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metric Comparison Chart */}
        <div className="lg:col-span-8 glass-panel p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-lg font-headline font-bold">核心指标多维对比 (Multi-Metric Comparison)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-[10px] text-on-surface-variant font-bold">RECALL@10</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-secondary" />
                <span className="text-[10px] text-on-surface-variant font-bold">NDCG@10</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2730" vertical={false} />
                <XAxis dataKey="name" stroke="#a5acb4" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1d2730' }}
                  contentStyle={{ backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px' }}
                />
                <Bar dataKey="recall" fill="#81ecff" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="ndcg" fill="#00affe" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolution Stage Tracking */}
        <div className="lg:col-span-4 glass-panel p-8 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-8">演进阶段追踪 (Evolution Stages)</h3>
          <div className="flex-1 space-y-8 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-surface-container-highest" />
            {[
              { stage: 'Stage 1: Initial Convergence', status: 'Stable', color: 'tertiary' },
              { stage: 'Stage 2: Attack Injection', status: 'Detected', color: 'error' },
              { stage: 'Stage 3: Defense Activation', status: 'Active', color: 'primary' },
              { stage: 'Stage 4: Final Equilibrium', status: 'Reached', color: 'tertiary' },
            ].map((item, i) => (
              <div key={item.stage} className="flex gap-6 relative z-10">
                <div className={cn("w-6 h-6 rounded-full border-4 border-surface flex items-center justify-center", `bg-${item.color}`)}>
                  <div className="w-1.5 h-1.5 rounded-full bg-surface" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">{item.stage}</p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", `text-${item.color}`)}>{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Config Matrix */}
        <div className="lg:col-span-12 glass-panel rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-highest/30">
            <div className="flex items-center gap-3">
              <Table className="w-5 h-5 text-primary" />
              <h3 className="font-headline font-bold">实验配置矩阵 (Configuration Matrix)</h3>
            </div>
            <button className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              查看完整参数 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-container-highest/50 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-8 py-4">实验组</th>
                  <th className="px-8 py-4">算法模型</th>
                  <th className="px-8 py-4">攻击策略</th>
                  <th className="px-8 py-4">防御机制</th>
                  <th className="px-8 py-4">隐私强度 (ε)</th>
                  <th className="px-8 py-4">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {[
                  { name: 'Baseline_01', model: 'FedAvg', attack: 'None', defense: 'None', privacy: '∞', status: 'Completed' },
                  { name: 'Attack_LF_20', model: 'FedAvg', attack: 'Label Flip (20%)', defense: 'None', privacy: '∞', status: 'Completed' },
                  { name: 'Defense_CS_v2', model: 'FedAvg', attack: 'Label Flip (20%)', defense: 'Cyber-Shield v2', privacy: '2.5', status: 'Completed' },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-surface-container-highest/30 transition-colors">
                    <td className="px-8 py-4 font-mono text-xs text-primary">{row.name}</td>
                    <td className="px-8 py-4 text-on-surface">{row.model}</td>
                    <td className="px-8 py-4 text-on-surface-variant">{row.attack}</td>
                    <td className="px-8 py-4 text-on-surface-variant">{row.defense}</td>
                    <td className="px-8 py-4 font-mono text-tertiary">{row.privacy}</td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase">SUCCESS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
