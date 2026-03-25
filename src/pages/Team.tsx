import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Users, Quote, ArrowRight, Cpu, Code, Database, Lock, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export const Team: React.FC = () => {
  const teamMembers = [
    {
      name: "Dr. Alexander Chen",
      role: "首席科学家 / 算法架构",
      description: "斯坦福大学人工智能博士，前大厂资深架构师。专注联邦学习收敛优化及同态加密在大规模系统中的应用。",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop",
      color: "primary"
    },
    {
      name: "Sarah Lin",
      role: "工程负责人 / 全栈开发",
      description: "10年高并发系统经验，主导过数个开源分布式框架。负责 Cyber Sentinel 平台的高性能算力调度与交互系统开发。",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop",
      color: "secondary"
    },
    {
      name: "Marcus Zhou",
      role: "安全官 / 密码学专家",
      description: "专注于零知识证明与差分隐私。为项目提供坚实的底层防御，确保在恶意节点攻击下数据的绝对安全性。",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop",
      color: "tertiary"
    }
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-12">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
        <div className="max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-headline text-5xl font-bold tracking-tight text-on-surface mb-8 leading-tight"
          >
            重塑数字边界的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">隐私计算先锋</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-on-surface-variant leading-relaxed mb-12 font-light"
          >
            本项目致力于在海量数据互联的时代，构建一个安全、透明且高效的联邦学习推荐生态。通过 Cyber Sentinel v1.0 平台，我们不仅保护用户隐私，更在孤岛化的数据之间架起信任的桥梁。
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-surface-container-low rounded-2xl border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-4">
                <Shield className="w-6 h-6 text-tertiary" />
                <h3 className="font-headline text-xl text-on-surface">核心使命</h3>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                消除数据壁垒，通过分布式计算框架确保原始数据不出本地，实现“数据可用不可见”的协作模式。
              </p>
            </div>
            <div className="p-8 bg-surface-container-low rounded-2xl border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-4">
                <Activity className="w-6 h-6 text-secondary" />
                <h3 className="font-headline text-xl text-on-surface">愿景目标</h3>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                建立一个普适化的联邦学习工业级平台，为金融、医疗、电商等行业提供极致的安全推荐体验。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section>
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface">核心团队</h2>
            <p className="text-on-surface-variant mt-2">汇集算法、安全与工程领域的顶尖专家</p>
          </div>
          <div className="h-[2px] flex-1 mx-12 bg-gradient-to-r from-primary/20 to-transparent mb-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, i) => (
            <motion.div 
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-surface-container-low p-6 rounded-2xl hover:bg-surface-container-high transition-all duration-500 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${member.color}/5 blur-3xl group-hover:bg-${member.color}/20 transition-all`} />
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-full overflow-hidden mb-6 border-2 border-${member.color}/20 group-hover:border-${member.color}/50 transition-all`}>
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h4 className="text-xl font-bold text-on-surface mb-1">{member.name}</h4>
                <p className={`text-${member.color} text-sm font-medium mb-4`}>{member.role}</p>
                <div className="h-px w-full bg-outline-variant/20 mb-4" />
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  {member.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section>
        <h2 className="font-headline text-3xl font-bold text-on-surface mb-12">技术栈图谱</h2>
        <div className="grid grid-cols-12 grid-rows-2 gap-6 h-[500px]">
          <div className="col-span-8 bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-on-surface text-surface rounded-xl flex items-center justify-center font-bold text-xl">P</div>
                <span className="text-2xl font-headline font-bold">PyTorch</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                底层深度学习引擎，通过其动态计算图特性实现复杂的联邦梯度聚合与本地模型微调。
              </p>
            </div>
            <div className="relative z-10 hidden lg:block opacity-20 group-hover:opacity-40 transition-all">
              <Cpu className="w-32 h-32 text-primary" />
            </div>
          </div>
          <div className="col-span-4 bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 group">
            <div className="mb-8">
              <div className="w-12 h-12 text-secondary flex items-center justify-center border-2 border-secondary rounded-full animate-pulse">
                <Code className="w-6 h-6" />
              </div>
            </div>
            <h4 className="text-xl font-bold mb-2">React / TS</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              构建高度响应式的实时监控看板，提供毫秒级的实验反馈。
            </p>
          </div>
          <div className="col-span-4 bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 group">
            <div className="mb-8">
              <div className="w-12 h-12 text-tertiary flex items-center justify-center border-2 border-tertiary rounded-full">
                <Database className="w-6 h-6" />
              </div>
            </div>
            <h4 className="text-xl font-bold mb-2">FedML Framework</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              标准联邦通信协议，支持千万级边缘节点的大规模并行仿真。
            </p>
          </div>
          <div className="col-span-8 bg-[#0c141b] p-8 rounded-3xl border border-primary/20 flex flex-wrap gap-4 items-center justify-center">
            {['Docker & Kubernetes', 'gRPC & Protocol Buffers', 'Redis & MongoDB', 'OpenSSL / Diffie-Hellman', 'Grafana & Prometheus'].map((tech, i) => (
              <div key={tech} className="px-4 py-2 bg-surface-container-highest rounded-lg border border-outline-variant/30 text-xs font-medium text-on-surface flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-secondary" : "bg-tertiary")} />
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Acknowledgements */}
      <section className="flex gap-12 items-center">
        <div className="flex-1 p-12 bg-gradient-to-br from-surface-container-low to-surface-container-high rounded-[2rem] border border-outline-variant/20 relative">
          <Quote className="absolute top-8 right-8 text-primary/10 w-16 h-16" />
          <h2 className="font-headline text-2xl font-bold mb-6">致谢与致辞</h2>
          <div className="space-y-4 text-on-surface-variant italic leading-relaxed">
            <p>“我们生活在一个数据即资产的时代，但也正处于隐私侵蚀的边缘。Cyber Sentinel 项目不仅仅是一个技术实验，它是我们对于未来数字世界的一种承诺——让每个人都能在享受智能化推荐的同时，拥有对自身数据绝对的掌控权。”</p>
            <p>特别感谢所有参与 Beta 测试的合作伙伴及开源社区的贡献者。正是因为你们的信任与支持，让联邦推荐从理论走向了工业级落地的可能。</p>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <div className="w-12 h-[1px] bg-primary" />
            <span className="text-on-surface font-bold text-sm tracking-widest uppercase">Team Cyber Sentinel</span>
          </div>
        </div>
        <div className="w-1/3 space-y-4">
          <div className="p-6 bg-surface-container-low rounded-2xl">
            <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Project Status</p>
            <p className="text-xl font-headline font-bold text-on-surface">V1.0 Stable Build</p>
          </div>
          <div className="p-6 bg-surface-container-low rounded-2xl">
            <p className="text-[10px] text-tertiary uppercase font-bold tracking-widest mb-1">Total Contributors</p>
            <p className="text-xl font-headline font-bold text-on-surface">24 Global Members</p>
          </div>
        </div>
      </section>

      <footer className="pt-12 border-t border-outline-variant/10 flex justify-between text-xs text-on-surface-variant/60">
        <p>© 2024 Cyber Sentinel Federation Project. All Rights Reserved.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-primary">隐私政策</a>
          <a href="#" className="hover:text-primary">服务条款</a>
          <a href="#" className="hover:text-primary">联系我们</a>
        </div>
      </footer>
    </div>
  );
};
