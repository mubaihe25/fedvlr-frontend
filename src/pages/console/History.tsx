import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar, Cpu, Shield, FilterX, ExternalLink, Clock, Database,
  AlertCircle, BarChart2, Download, X, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';

export const History: React.FC = () => {
  return (
    <div className="pb-12">
      {/* Page Title & Quick Stats */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-background tracking-tight mb-2">历史实验记录</h1>
          <p className="text-on-surface-variant text-sm">追溯、管理并对比所有已执行的联邦学习攻防实验任务。</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-surface-container rounded-xl border-l-4 border-primary">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">总实验数</p>
            <p className="text-2xl font-headline font-bold text-primary">1,284</p>
          </div>
          <div className="px-6 py-3 bg-surface-container rounded-xl border-l-4 border-tertiary">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">成功率</p>
            <p className="text-2xl font-headline font-bold text-tertiary">94.2%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Sidebar & Main List Container */}
        <div className="lg:col-span-9 space-y-6">
          {/* Filter Bar */}
          <section className="bg-surface-container-low p-4 rounded-xl flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant/10">
              <Calendar className="w-4 h-4 text-primary" />
              <select className="bg-transparent border-none text-xs focus:ring-0 text-on-surface cursor-pointer outline-none">
                <option>最近 7 天</option>
                <option>最近 30 天</option>
                <option>2023 年度</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant/10">
              <Cpu className="w-4 h-4 text-primary" />
              <select className="bg-transparent border-none text-xs focus:ring-0 text-on-surface cursor-pointer outline-none">
                <option>全部模型</option>
                <option>ResNet-50</option>
                <option>BERT-Base</option>
                <option>Graph-SAGE</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant/10">
              <Shield className="w-4 h-4 text-primary" />
              <select className="bg-transparent border-none text-xs focus:ring-0 text-on-surface cursor-pointer outline-none">
                <option>攻防模式</option>
                <option>对抗攻击</option>
                <option>差分隐私</option>
                <option>同态加密</option>
              </select>
            </div>
            <button className="ml-auto text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              <FilterX className="w-4 h-4" />
              重置筛选
            </button>
          </section>

          {/* Record List (Bento-style items) */}
          <div className="space-y-4">
            {/* Record Item 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-surface-container-low rounded-xl p-5 border border-transparent hover:border-primary/30 hover:bg-surface-container transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_0_40px_rgba(129,236,255,0.02)]"
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-on-surface-variant hover:text-primary p-1">
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 shrink-0">
                    <Shield className="w-6 h-6 text-primary" fill="currentColor" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-on-background">任务 #EXP-20240512-01</h3>
                      <span className="bg-tertiary/10 text-tertiary text-[10px] px-2 py-0.5 rounded border border-tertiary/20 font-bold uppercase tracking-wider">COMPLETED</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 2024-05-12 14:30</span>
                      <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> ResNet-101</span>
                      <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> CIFAR-100</span>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right w-full sm:w-auto">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-1">指标简报</p>
                  <div className="flex gap-3 sm:justify-end">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs text-on-surface-variant">Accuracy</span>
                      <span className="font-headline font-bold text-primary text-lg">91.4%</span>
                    </div>
                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs text-on-surface-variant">Loss</span>
                      <span className="font-headline font-bold text-secondary text-lg">0.042</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap sm:flex-nowrap gap-2">
                <button className="flex-1 py-2 text-[11px] font-bold bg-surface-container-highest rounded hover:bg-primary hover:text-on-primary transition-all">查看详情</button>
                <button className="flex-1 py-2 text-[11px] font-bold bg-surface-container-highest rounded hover:bg-secondary hover:text-on-primary transition-all">加入对比</button>
                <button className="flex-1 py-2 text-[11px] font-bold bg-surface-container-highest rounded hover:bg-tertiary hover:text-on-tertiary transition-all">复用配置</button>
              </div>
            </motion.div>

            {/* Record Item 2 (Failed) */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative bg-surface-container-low rounded-xl p-5 border border-transparent hover:border-error/30 hover:bg-surface-container transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_0_40px_rgba(255,113,108,0.02)]"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 shrink-0">
                    <AlertTriangle className="w-6 h-6 text-error" fill="currentColor" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-on-background">任务 #EXP-20240512-08</h3>
                      <span className="bg-error/10 text-error text-[10px] px-2 py-0.5 rounded border border-error/20 font-bold uppercase tracking-wider">FAILED</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 2024-05-12 16:15</span>
                      <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> Vision Transformer</span>
                      <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> ImageNet-1K</span>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right w-full sm:w-auto">
                  <p className="text-[10px] text-error font-bold tracking-widest mb-1 flex items-center sm:justify-end gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> 内存溢出 (OOM)
                  </p>
                  <span className="text-xs text-on-surface-variant">实验在第 12 轮迭代处中断</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap sm:flex-nowrap gap-2">
                <button className="flex-1 py-2 text-[11px] font-bold bg-surface-container-highest rounded hover:bg-error hover:text-on-error transition-all">查看日志</button>
                <button className="flex-1 py-2 text-[11px] font-bold bg-surface-container-highest rounded hover:bg-tertiary hover:text-on-tertiary transition-all">尝试重运行</button>
              </div>
            </motion.div>

            {/* Record Item 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative bg-surface-container-low rounded-xl p-5 border border-transparent hover:border-primary/30 hover:bg-surface-container transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_0_40px_rgba(129,236,255,0.02)]"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 shrink-0">
                    <Shield className="w-6 h-6 text-primary" fill="currentColor" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-on-background">任务 #EXP-20240511-22</h3>
                      <span className="bg-tertiary/10 text-tertiary text-[10px] px-2 py-0.5 rounded border border-tertiary/20 font-bold uppercase tracking-wider">COMPLETED</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 2024-05-11 23:10</span>
                      <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> FL-BERT</span>
                      <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> Yelp-Reviews</span>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right w-full sm:w-auto">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-1">指标简报</p>
                  <div className="flex gap-3 sm:justify-end">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs text-on-surface-variant">F1 Score</span>
                      <span className="font-headline font-bold text-primary text-lg">0.887</span>
                    </div>
                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs text-on-surface-variant">Privacy Budget</span>
                      <span className="font-headline font-bold text-secondary text-lg">ε=1.2</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap sm:flex-nowrap gap-2">
                <button className="flex-1 py-2 text-[11px] font-bold bg-surface-container-highest rounded hover:bg-primary hover:text-on-primary transition-all">查看详情</button>
                <button className="flex-1 py-2 text-[11px] font-bold bg-surface-container-highest rounded hover:bg-secondary hover:text-on-primary transition-all">加入对比</button>
                <button className="flex-1 py-2 text-[11px] font-bold bg-surface-container-highest rounded hover:bg-tertiary hover:text-on-tertiary transition-all">复用配置</button>
              </div>
            </motion.div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 pt-4">
            <button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold text-xs">1</button>
            <button className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary font-bold text-xs transition-colors">2</button>
            <button className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary font-bold text-xs transition-colors">3</button>
            <span className="text-on-surface-variant text-xs mx-2">...</span>
            <button className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary font-bold text-xs transition-colors">42</button>
            <button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Detail Sidebar (Fixed-ish) */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 bg-surface-container p-6 rounded-2xl border border-outline-variant/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline font-bold text-lg text-on-background">详情预览</h2>
              <button className="text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Configuration Summary */}
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-3">配置参数摘要</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant mb-1">学习率</p>
                    <p className="text-xs font-bold font-headline">0.0001</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant mb-1">Batch Size</p>
                    <p className="text-xs font-bold font-headline">128</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant mb-1">差分隐私</p>
                    <p className="text-xs font-bold font-headline text-tertiary">开启</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant mb-1">优化器</p>
                    <p className="text-xs font-bold font-headline">AdamW</p>
                  </div>
                </div>
              </div>

              {/* Mini Chart Preview */}
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-3">收敛曲线预览</p>
                <div className="h-32 bg-surface-container-low rounded-xl relative flex items-end px-2 pb-2 gap-1 overflow-hidden border border-outline-variant/5">
                  {/* Dummy chart lines with heights */}
                  <div className="flex-1 bg-primary/20 rounded-t-sm" style={{ height: '20%' }}></div>
                  <div className="flex-1 bg-primary/30 rounded-t-sm" style={{ height: '35%' }}></div>
                  <div className="flex-1 bg-primary/40 rounded-t-sm" style={{ height: '55%' }}></div>
                  <div className="flex-1 bg-primary/50 rounded-t-sm" style={{ height: '70%' }}></div>
                  <div className="flex-1 bg-primary/60 rounded-t-sm" style={{ height: '85%' }}></div>
                  <div className="flex-1 bg-primary/70 rounded-t-sm" style={{ height: '92%' }}></div>
                  <div className="flex-1 bg-primary/80 rounded-t-sm" style={{ height: '95%' }}></div>
                  <div className="flex-1 bg-primary/90 rounded-t-sm" style={{ height: '98%' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute inset-x-0 bottom-4 border-t border-primary/20 border-dashed w-full h-px"></div>
                  <div className="absolute inset-x-0 bottom-12 border-t border-primary/10 border-dashed w-full h-px"></div>
                  <div className="absolute inset-x-0 bottom-20 border-t border-primary/5 border-dashed w-full h-px"></div>
                </div>
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-[9px] text-on-surface-variant">Epoch 0</span>
                  <span className="text-[9px] text-on-surface-variant">Epoch 100</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-outline-variant/10 space-y-3">
                <button className="w-full bg-gradient-to-r from-primary to-secondary py-3 rounded-xl font-bold text-on-primary text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  <BarChart2 className="w-5 h-5" />
                  生成完整分析报告
                </button>
                <button className="w-full bg-surface-container-highest py-3 rounded-xl font-bold text-on-background text-sm flex items-center justify-center gap-2 border border-outline-variant/10 hover:border-primary/50 transition-all">
                  <Download className="w-5 h-5" />
                  导出 CSV 原始数据
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
