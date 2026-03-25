import React from 'react';
import { motion } from 'motion/react';
import { Settings, ShieldAlert, Cpu, Info, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Configuration: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-2 block">Environment Setup</span>
          <h3 className="text-4xl font-headline font-bold text-on-background tracking-tight">训练实验配置</h3>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-all">
            加载默认
          </button>
          <button className="px-5 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-all">
            重置配置
          </button>
          <button className="px-8 py-2.5 rounded-lg text-sm font-bold text-surface bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_rgba(129,236,255,0.3)] hover:shadow-[0_0_30px_rgba(129,236,255,0.5)] transition-all active:scale-[0.98]">
            开始训练
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Basic Config */}
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-headline font-bold">基础运行配置</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">数据集 (Dataset)</label>
                <div className="relative">
                  <select className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 text-on-surface appearance-none focus:ring-1 focus:ring-primary transition-all">
                    <option>CIFAR-10 Federated</option>
                    <option>MNIST Federated</option>
                    <option>Fashion-MNIST</option>
                    <option>CelebA (Non-IID)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">算法模型 (Model/Algorithm)</label>
                <div className="relative">
                  <select className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 text-on-surface appearance-none focus:ring-1 focus:ring-primary transition-all">
                    <option>FedAvg (Baseline)</option>
                    <option>FedProx</option>
                    <option>SCAFFOLD</option>
                    <option>FedMeta</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">实验模式 (Mode)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['基线实验', '攻击实验', '防御实验', '攻防对比'].map((mode, i) => (
                    <button 
                      key={mode}
                      className={cn(
                        "py-3 px-4 rounded-lg text-sm font-medium border transition-all",
                        i === 1 
                          ? "bg-surface-container-highest border-error-dim/50 text-error-dim shadow-[inset_0_0_10px_rgba(215,56,59,0.1)]" 
                          : "bg-surface-container-highest border-transparent text-on-surface-variant hover:border-primary/30 hover:text-on-surface"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hyperparameters */}
          <div className="glass-panel p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="w-5 h-5 text-tertiary" />
              <h4 className="text-lg font-headline font-bold">超参数设定</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">学习率 (LR)</label>
                  <span className="text-sm font-mono text-primary">0.0015</span>
                </div>
                <input type="range" className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">训练轮数 (Epochs)</label>
                  <span className="text-sm font-mono text-primary">120</span>
                </div>
                <input type="range" className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase">客户端数量</label>
                <input type="number" defaultValue={100} className="w-full bg-surface-container-highest border-none rounded-lg py-2 px-4 text-primary font-mono focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Attack Strategy */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="bg-error/10 p-4 border-b border-error/20">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-error" />
                <h4 className="font-headline font-bold text-error">攻击策略配置</h4>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">攻击类型</label>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-error/10 border border-error/20 rounded text-[11px] font-bold text-error">Label Flipping</span>
                  <span className="px-3 py-1 bg-surface-container-highest rounded text-[11px] font-bold text-on-surface-variant">Backdoor</span>
                  <span className="px-3 py-1 bg-surface-container-highest rounded text-[11px] font-bold text-on-surface-variant">Gradient Noise</span>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">攻击比率 (Poisoning Ratio)</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-error" style={{ width: '20%' }} />
                  </div>
                  <span className="text-sm font-mono text-error">20%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="glass-panel p-6 rounded-xl border-l-4 border-primary">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">实验概览</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">预计训练时长</span>
                <span className="text-on-surface font-mono">~ 2h 45m</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">资源预估 (GPU)</span>
                <span className="text-on-surface font-mono">12.4 GB</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">隐私保护强度</span>
                <span className="px-2 py-0.5 rounded bg-tertiary/20 text-tertiary text-[10px] font-bold">MODERATE</span>
              </div>
            </div>
            <div className="mt-8 relative aspect-video rounded-lg overflow-hidden border border-primary/10">
              <img 
                src="https://picsum.photos/seed/network/400/225" 
                alt="Topology" 
                className="object-cover w-full h-full opacity-60"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent flex flex-col justify-end p-4">
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Topology Preview</p>
                <p className="text-xs text-on-surface/80">100 Clients (Non-IID Distribution)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
