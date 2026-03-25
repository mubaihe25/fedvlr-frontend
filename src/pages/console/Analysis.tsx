import React from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, ShieldCheck, Zap, Target, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

const performanceData = [
  { epoch: 0, baseline: 0.1, defense: 0.12 },
  { epoch: 20, baseline: 0.35, defense: 0.42 },
  { epoch: 40, baseline: 0.58, defense: 0.65 },
  { epoch: 60, baseline: 0.72, defense: 0.81 },
  { epoch: 80, baseline: 0.85, defense: 0.92 },
  { epoch: 100, baseline: 0.91, defense: 0.94 },
];

export const Analysis: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-headline text-3xl font-bold text-on-surface">单次实验分析报告</h2>
          </div>
          <p className="text-on-surface-variant text-sm">实验批次: <span className="text-primary font-mono">EXP-20240524-001</span> | 生成时间: 2024-05-24 15:45</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 rounded-lg bg-surface-container-highest text-on-surface text-sm font-semibold hover:bg-surface-bright transition-all">
            导出 PDF
          </button>
          <button className="px-6 py-2.5 rounded-lg bg-primary text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
            分享报告
          </button>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Recall@10', value: '0.942', change: '+2.4%', icon: Target, color: 'primary' },
          { label: 'NDCG@10', value: '0.885', change: '+1.8%', icon: Zap, color: 'secondary' },
          { label: '训练总时长', value: '2h 44m', change: '-12m', icon: FileText, color: 'on-surface' },
          { label: '收敛轮次', value: '82', change: 'Stable', icon: ShieldCheck, color: 'tertiary' },
        ].map((metric) => (
          <div key={metric.label} className="glass-panel p-6 rounded-2xl border-l-4 border-primary">
            <div className="flex justify-between items-start mb-4">
              <div className={ `p-2 rounded-lg bg-${metric.color}/10` }>
                <metric.icon className={ `w-5 h-5 text-${metric.color}` } />
              </div>
              <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">{metric.change}</span>
            </div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">{metric.label}</p>
            <p className="text-2xl font-headline font-bold text-on-surface">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Defense Efficiency Score */}
        <div className="lg:col-span-4 glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-primary" />
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-8">防御效能评分 (Defense Efficiency)</h3>
          <div className="relative mb-8">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-surface-container-highest" />
              <circle 
                cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" 
                strokeDasharray={552} strokeDashoffset={552 * (1 - 0.942)}
                className="text-tertiary drop-shadow-[0_0_15px_rgba(175,255,209,0.4)]" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-headline font-bold text-on-surface">94.2</span>
              <span className="text-xs text-on-surface-variant font-bold">/ 100</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-tertiary">卓越 (Excellent)</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              该防御策略在面对 Label Flipping 攻击时表现出极高的鲁棒性，模型效能损失低于 2%。
            </p>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-8 glass-panel p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-lg font-headline font-bold">效能演进曲线 (Utility Evolution)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-on-surface-variant">防御方案</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-on-surface-variant" />
                <span className="text-xs text-on-surface-variant">基线方案</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2730" vertical={false} />
                <XAxis dataKey="epoch" stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a5acb4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121a22', border: '1px solid #1d2730', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="defense" stroke="#81ecff" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="baseline" stroke="#a5acb4" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="lg:col-span-12 glass-panel p-8 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              <h4 className="font-bold">核心结论</h4>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              本次实验成功验证了 <span className="text-on-surface font-bold">Cyber-Shield v2</span> 算法在非独立同分布 (Non-IID) 数据下的收敛稳定性。相比基线，Recall@10 提升了 8.4%。
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-tertiary">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-bold">安全评估</h4>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              在 20% 节点投毒的极端环境下，系统通过梯度裁剪与异常检测机制，成功拦截了 98.5% 的恶意更新，确保了全局模型的纯净度。
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-secondary">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold">优化建议</h4>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              建议在下一阶段实验中增加 <span className="text-on-surface font-bold">差分隐私 (DP)</span> 噪声强度测试，以进一步权衡模型精度与隐私保护强度。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
