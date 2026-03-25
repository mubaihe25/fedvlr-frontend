import React from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Info, StopCircle, BarChart3, TrendingUp, Terminal as TerminalIcon, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

const lossData = [
  { epoch: 0, loss: 0.9 },
  { epoch: 20, loss: 0.7 },
  { epoch: 40, loss: 0.4 },
  { epoch: 60, loss: 0.25 },
  { epoch: 80, loss: 0.15 },
  { epoch: 100, loss: 0.12 },
];

const metricData = [
  { name: 'F1-Score', value: 85 },
  { name: 'Precision', value: 92 },
  { name: 'Recall', value: 78 },
  { name: 'MAP', value: 88 },
];

export const Monitoring: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-background">实时监控中心</h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20">
              <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="text-xs font-bold text-tertiary">训练进行中</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm">正在实时追踪分布式联邦学习节点的训练动态与模型收敛性能。</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded bg-surface-container-highest text-on-surface text-sm font-semibold hover:bg-surface-bright transition-all flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            结果详情
          </button>
          <button className="px-5 py-2.5 rounded bg-error/20 text-error text-sm font-semibold hover:bg-error/30 transition-all flex items-center gap-2">
            <StopCircle className="w-4 h-4" />
            终止任务
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Task Overview */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4" />
              任务概览 (Task Overview)
            </h3>
            <div className="space-y-4">
              {[
                { label: '任务 ID', value: 'FS-MON-2024-X892', mono: true, primary: true },
                { label: '预训练模型', value: 'ResNet-50-Federated' },
                { label: '当前数据集', value: 'Encrypted_Financial_Log_v4' },
                { label: '活跃节点', value: '24 / 24 Active', tertiary: true },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                  <span className="text-sm text-on-surface-variant">{item.label}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    item.mono && "font-mono",
                    item.primary ? "text-primary" : item.tertiary ? "text-tertiary" : "text-on-surface"
                  )}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-outline-variant/10">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-secondary h-full w-[68%]" />
              </div>
              <span className="text-xl font-headline font-bold text-primary">68%</span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2 font-medium tracking-wide">TOTAL TRAINING COMPLETION</p>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container-highest" />
                <circle 
                  cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8" 
                  strokeDasharray={440} strokeDashoffset={440 * (1 - 0.72)}
                  className="text-primary drop-shadow-[0_0_8px_rgba(129,236,255,0.4)] transition-all duration-1000" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-headline font-bold text-on-surface">72</span>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase">Epochs</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">当前轮次 (Rounds)</p>
              <p className="text-xs text-on-surface-variant">Target: 100 Epochs</p>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-6">
            {[
              { label: 'VAL ACCURACY', value: '94.2%', color: 'tertiary', percent: 94 },
              { label: 'LEARNING RATE', value: '0.00012', color: 'primary', percent: 40 },
              { label: 'ESTIMATED TIME', value: '02:44:12', color: 'on-surface', percent: 75 },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                  <span>{stat.label}</span>
                  <span className={`text-${stat.color}`}>{stat.value}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={cn("h-full", `bg-${stat.color}`)} style={{ width: `${stat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              实时收敛曲线 (Loss Convergence)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lossData}>
                <defs>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#81ecff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#81ecff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2730" vertical={false} />
                <XAxis dataKey="epoch" stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px' }}
                  itemStyle={{ color: '#81ecff' }}
                />
                <Area type="monotone" dataKey="loss" stroke="#81ecff" strokeWidth={3} fillOpacity={1} fill="url(#colorLoss)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-tertiary" />
              指标表现对比 (Metric Performance)
            </h3>
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Real-time sampling</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2730" vertical={false} />
                <XAxis dataKey="name" stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1d2730' }}
                  contentStyle={{ backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#afffd1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Terminal */}
        <div className="col-span-12 bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-surface-container-highest flex items-center justify-between border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              <TerminalIcon className="w-4 h-4 text-on-surface-variant" />
              <h3 className="text-sm font-bold">实时运行日志 (Real-time Execution Logs)</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-[10px] text-on-surface-variant font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                STREAMING ACTIVE
              </span>
              <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6 bg-black/60 h-80 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 no-scrollbar">
            <p className="text-on-surface-variant">[2024-05-24 14:22:01] <span className="text-primary">INFO</span> Initializing Federated Server connection...</p>
            <p className="text-on-surface-variant">[2024-05-24 14:22:05] <span className="text-primary">INFO</span> Node synchronization complete (24/24 nodes verified).</p>
            <p className="text-on-surface-variant">[2024-05-24 14:22:10] <span className="text-tertiary">SUCCESS</span> Round 65 weights aggregated from all edge clients.</p>
            <p className="text-on-surface-variant">[2024-05-24 14:23:45] <span className="text-primary">INFO</span> Starting Global Model Update - Round 66.</p>
            <p className="text-on-surface/70">... [System Update] Delta compression: 45.2MB -&gt; 12.1MB</p>
            <p className="text-on-surface/70">... [Node-008] Gradient push: latency 24ms, security hash verified.</p>
            <p className="text-on-surface/70">... [Node-015] Gradient push: latency 18ms, security hash verified.</p>
            <p className="text-on-surface-variant">[2024-05-24 14:25:12] <span className="text-primary">INFO</span> Validation metrics recalculated: Global Accuracy = 0.9423</p>
            <p className="text-on-surface-variant">[2024-05-24 14:26:30] <span className="text-primary">INFO</span> Moving to Epoch 72: Learning rate adjusted to 0.00012</p>
            <p className="text-primary animate-pulse">_</p>
          </div>
        </div>
      </div>
    </div>
  );
};
