import React from 'react';
import { motion } from 'motion/react';
import { 
  MonitorSmartphone, 
  ArrowRight, 
  Cloud, 
  Swords, 
  Shield, 
  Network, 
  Microscope, 
  ShieldCheck, 
  TrendingUp,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PageType } from '../types/common';

interface HomeProps {
  onPageChange?: (page: PageType) => void;
}

export const Home: React.FC<HomeProps> = ({ onPageChange }) => {
  return (
    <div className="space-y-24 pb-12 relative">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img 
            className="w-full h-full object-cover" 
            alt="abstract digital connection network" 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface z-0" />
        
        <div className="relative z-10 max-w-4xl mx-auto mt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6 kinetic-glow"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Next-Gen Decentralized Security
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-headline mb-6 bg-gradient-to-br from-white via-primary to-secondary bg-clip-text text-transparent leading-[1.1] tracking-tight"
          >
            联邦智能守护：<br/>多模态推荐安全实验平台
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            面向对抗性攻防的去中心化学习范式。提供高维数据的联邦计算、自动化红蓝攻防模拟以及实时的鲁棒性评估。
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => onPageChange?.('console')}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-surface font-bold rounded-lg shadow-[0_8px_32px_rgba(129,236,255,0.25)] hover:shadow-[0_12px_48px_rgba(129,236,255,0.4)] transition-all hover:-translate-y-1 active:scale-95"
            >
              启动训练控制台
            </button>
            <button className="px-8 py-4 bg-surface-container-highest/50 backdrop-blur-md border border-outline-variant/30 text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-all active:scale-95">
              查看技术架构
            </button>
          </motion.div>
        </div>
      </section>

      {/* Flow Visualization */}
      <section className="w-full">
        <div className="flex flex-col items-start mb-16">
          <h2 className="text-3xl font-bold font-headline mb-4">系统流程可视化</h2>
          <div className="w-16 h-1 bg-primary"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center relative">
          {/* Client Nodes */}
          <div className="col-span-1 space-y-4">
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 text-center">
              <MonitorSmartphone className="text-primary w-10 h-10 mx-auto mb-2" />
              <div className="text-sm font-bold">联邦客户端 A</div>
            </div>
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 text-center">
              <MonitorSmartphone className="text-primary w-10 h-10 mx-auto mb-2" />
              <div className="text-sm font-bold">联邦客户端 B</div>
            </div>
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 text-center opacity-50">
              <MonitorSmartphone className="text-primary w-10 h-10 mx-auto mb-2" />
              <div className="text-sm font-bold">... (客户端 N)</div>
            </div>
          </div>
          
          {/* Connectors 1 */}
          <div className="hidden lg:flex justify-center">
            <ArrowRight className="text-outline-variant/40 w-12 h-12" />
          </div>
          
          {/* Aggregator/Red/Green Center */}
          <div className="col-span-1 lg:col-span-1 flex flex-col gap-6">
            <div className="relative p-8 rounded-2xl bg-surface-container-highest border-2 border-primary/20 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <Cloud className="w-16 h-16" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-primary">聚合服务器</h3>
              <p className="text-xs text-on-surface-variant">模型参数全局聚合</p>
            </div>
            
            {/* Red Team Tag */}
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 flex items-center gap-3">
              <Swords className="text-error w-6 h-6" />
              <div>
                <div className="text-xs font-bold text-error">红军攻击模拟</div>
                <div className="text-[10px] opacity-60 text-on-surface">数据投毒 / 模型投毒</div>
              </div>
            </div>
            
            {/* Green Team Tag */}
            <div className="p-4 rounded-xl bg-tertiary/10 border border-tertiary/30 flex items-center gap-3">
              <Shield className="text-tertiary w-6 h-6" />
              <div>
                <div className="text-xs font-bold text-tertiary">绿军防御加固</div>
                <div className="text-[10px] opacity-60 text-on-surface">异常检测 / 安全聚合</div>
              </div>
            </div>
          </div>
          
          {/* Connectors 2 */}
          <div className="hidden lg:flex justify-center">
            <ArrowRight className="text-outline-variant/40 w-12 h-12" />
          </div>
          
          {/* Result Panel */}
          <div className="col-span-1 lg:col-span-1 h-full">
            <div className="p-8 rounded-2xl bg-surface-container-high border border-primary/10 h-full flex flex-col justify-center">
              <h3 className="text-lg font-bold mb-4">实时评估输出</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-60">效能评分</span>
                  <span className="text-primary font-bold">98.4%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full w-[98%]"></div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs opacity-60">防御延迟</span>
                  <span className="text-tertiary font-bold">12ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-10 rounded-3xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/30 transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Network className="text-primary w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-headline text-on-surface">联邦学习框架</h3>
            <p className="text-on-surface-variant leading-relaxed">
              基于FedAvg与个性化联邦算法，支持千万级异构数据的高效协同训练，确保原始数据不出本地。
            </p>
          </div>
          
          {/* Card 2 */}
          <div className="p-10 rounded-3xl bg-surface-container-low border border-outline-variant/10 hover:border-error/30 transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Microscope className="text-error w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-headline text-on-surface">攻击模拟</h3>
            <p className="text-on-surface-variant leading-relaxed">
              集成Sybil攻击、洗钱式投毒等前沿攻防脚本，一键构建极端对抗实验环境。
            </p>
          </div>
          
          {/* Card 3 */}
          <div className="p-10 rounded-3xl bg-surface-container-low border border-outline-variant/10 hover:border-tertiary/30 transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-tertiary w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-headline text-on-surface">防御评估</h3>
            <p className="text-on-surface-variant leading-relaxed">
              多维度防御策略池，通过鲁棒性增益、效能损耗等5大关键指标进行量化评估。
            </p>
          </div>
        </div>
      </section>

      {/* Representative Results */}
      <section className="w-full">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-3xl font-bold font-headline mb-4">实验效能快照</h2>
            <p className="text-on-surface-variant">当前正在运行的联邦推荐模型对比分析结果</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-xs">
              <span className="w-3 h-3 rounded-full bg-outline-variant"></span> 基准模型
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-xs">
              <span className="w-3 h-3 rounded-full bg-error"></span> 受攻击模型
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-xs">
              <span className="w-3 h-3 rounded-full bg-tertiary"></span> 防御后模型
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Metric 1 */}
          <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between">
            <div className="text-sm font-medium text-on-surface-variant uppercase tracking-widest mb-4">Recall @ 20</div>
            <div className="text-4xl font-bold font-headline text-primary">0.2481</div>
            <div className="mt-4 flex items-center gap-2 text-tertiary text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>+12.4% vs Baseline</span>
            </div>
          </div>
          
          {/* Metric 2 */}
          <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between">
            <div className="text-sm font-medium text-on-surface-variant uppercase tracking-widest mb-4">NDCG @ 20</div>
            <div className="text-4xl font-bold font-headline text-primary">0.1856</div>
            <div className="mt-4 flex items-center gap-2 text-tertiary text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>+8.7% vs Baseline</span>
            </div>
          </div>
          
          {/* Comparison Chart (CSS Based) */}
          <div className="lg:col-span-2 p-8 rounded-2xl bg-surface-container-low border border-outline-variant/10 relative overflow-hidden flex flex-col">
            <div className="flex items-end justify-around h-48 gap-4 mb-4 flex-1">
              {/* Baseline */}
              <div className="flex flex-col items-center flex-1 h-full justify-end">
                <div className="w-full max-w-[80px] bg-outline-variant/20 rounded-t-lg transition-all" style={{ height: '70%' }}></div>
                <div className="mt-2 text-[10px] text-on-surface-variant">Baseline</div>
              </div>
              {/* Attack */}
              <div className="flex flex-col items-center flex-1 h-full justify-end">
                <div className="w-full max-w-[80px] bg-error/40 rounded-t-lg transition-all" style={{ height: '35%' }}></div>
                <div className="mt-2 text-[10px] text-error">Attacked</div>
              </div>
              {/* Defense */}
              <div className="flex flex-col items-center flex-1 h-full justify-end">
                <div className="w-full max-w-[80px] bg-tertiary/60 rounded-t-lg transition-all" style={{ height: '65%' }}></div>
                <div className="mt-2 text-[10px] text-tertiary">Defended</div>
              </div>
            </div>
            <div className="text-xs text-center text-on-surface-variant italic">
              对抗环境下各阶段模型推荐效能对比 (NDCG 指标)
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-outline-variant/20 bg-surface-container-low/50 -mx-8 px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
              <Shield className="text-primary w-5 h-5" />
            </div>
            <div>
              <span className="font-headline font-bold text-lg">联邦推荐平台</span>
              <p className="text-xs text-on-surface-variant">© 2024 Federated Security Lab. All rights reserved.</p>
            </div>
          </div>
          <div className="flex gap-8 text-sm text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">技术文档</a>
            <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
            <a href="#" className="hover:text-primary transition-colors">开源协议</a>
          </div>
        </div>
      </footer>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-surface rounded-full shadow-[0_0_20px_rgba(129,236,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
