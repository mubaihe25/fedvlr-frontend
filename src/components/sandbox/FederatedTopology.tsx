import React from 'react';
import {motion} from 'motion/react';
import {Database, FileText, Image, Server, ShieldCheck, Sparkles, Swords, UserRound} from 'lucide-react';
import {cn} from '../../lib/utils';

interface FederatedTopologyProps {
  mode?: 'overview' | 'exercise';
  defenseActive?: boolean;
  className?: string;
}

const clients = [
  {id: 'C1', x: 108, y: 72, tone: 'benign', label: '美妆浏览'},
  {id: 'C2', x: 332, y: 54, tone: 'benign', label: '文本偏好'},
  {id: 'C3', x: 520, y: 132, tone: 'malicious', label: '恶意注入'},
  {id: 'C4', x: 560, y: 324, tone: 'benign', label: '交互历史'},
  {id: 'C5', x: 356, y: 418, tone: 'defense', label: '防御恢复'},
  {id: 'C6', x: 110, y: 382, tone: 'benign', label: '商品图文'},
  {id: 'C7', x: 48, y: 224, tone: 'malicious', label: '异常更新'},
];

const server = {x: 304, y: 238};

const toneStyle = {
  benign: {
    stroke: '#22d3ee',
    fill: 'rgba(34, 211, 238, 0.16)',
    text: 'text-cyan-200',
    border: 'border-cyan-300/40',
    shadow: 'shadow-[0_0_24px_rgba(34,211,238,0.18)]',
  },
  malicious: {
    stroke: '#fb7185',
    fill: 'rgba(251, 113, 133, 0.18)',
    text: 'text-rose-200',
    border: 'border-rose-300/50',
    shadow: 'shadow-[0_0_24px_rgba(251,113,133,0.22)]',
  },
  defense: {
    stroke: '#86efac',
    fill: 'rgba(134, 239, 172, 0.18)',
    text: 'text-emerald-200',
    border: 'border-emerald-300/50',
    shadow: 'shadow-[0_0_24px_rgba(134,239,172,0.18)]',
  },
} as const;

const dataSources = [
  {label: '商品图片', icon: Image, color: 'text-cyan-200'},
  {label: '文本描述', icon: FileText, color: 'text-sky-200'},
  {label: '交互记录', icon: Database, color: 'text-emerald-200'},
];

export const FederatedTopology: React.FC<FederatedTopologyProps> = ({mode = 'exercise', defenseActive = true, className}) => {
  const isOverview = mode === 'overview';

  return (
    <div className={cn('relative overflow-hidden rounded-[28px] border border-slate-700/50 bg-black/30 p-4 backdrop-blur-md', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.16),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.62),rgba(2,6,23,0.94))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />

      <div className="relative z-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200/80">Federated Digital Twin</p>
            <h3 className="mt-1 text-xl font-bold text-white">{isOverview ? '联邦安全推荐数字沙盘' : '攻防演练拓扑'}</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-cyan-100">蓝色：正常更新</span>
            <span className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-rose-100">红色：恶意更新</span>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-emerald-100">绿色：防御恢复</span>
          </div>
        </div>

        <div className="relative mx-auto aspect-[1.32/1] w-full max-w-[760px]">
          <svg viewBox="0 0 620 470" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="serverGradient">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.36" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.2" />
              </radialGradient>
            </defs>

            {clients.map((client, index) => {
              const tone = toneStyle[client.tone as keyof typeof toneStyle];
              const hasDefenseInterception = defenseActive && client.tone === 'malicious';

              return (
                <g key={client.id}>
                  <line
                    x1={client.x}
                    y1={client.y}
                    x2={server.x}
                    y2={server.y}
                    stroke={tone.stroke}
                    strokeOpacity={client.tone === 'malicious' ? 0.8 : 0.48}
                    strokeWidth={client.tone === 'malicious' ? 2.4 : 1.6}
                    className={client.tone === 'malicious' ? 'sandbox-flow-fast' : 'sandbox-flow'}
                    filter="url(#softGlow)"
                  />
                  <motion.circle
                    r={client.tone === 'malicious' ? 5.5 : 4.5}
                    fill={tone.stroke}
                    filter="url(#softGlow)"
                    initial={{cx: client.x, cy: client.y, opacity: 0.25}}
                    animate={{
                      cx: hasDefenseInterception ? [client.x, server.x - 44, server.x - 26] : [client.x, server.x],
                      cy: hasDefenseInterception ? [client.y, server.y - 18, server.y] : [client.y, server.y],
                      opacity: hasDefenseInterception ? [0.2, 1, 0] : [0.2, 1, 0.2],
                      scale: hasDefenseInterception ? [0.8, 1.2, 0.2] : [0.7, 1.1, 0.7],
                    }}
                    transition={{duration: client.tone === 'malicious' ? 1.8 : 2.7, repeat: Infinity, delay: index * 0.18, ease: 'easeInOut'}}
                  />
                </g>
              );
            })}

            {!defenseActive ? (
              <>
                <circle cx={server.x} cy={server.y} r="66" fill="none" stroke="#fb7185" strokeOpacity="0.36" strokeWidth="2" className="sandbox-defense-ring" />
                <circle cx={server.x} cy={server.y} r="92" fill="none" stroke="#fb7185" strokeOpacity="0.18" strokeWidth="2" className="sandbox-defense-ring" />
              </>
            ) : (
              <>
                <circle cx={server.x} cy={server.y} r="78" fill="none" stroke="#86efac" strokeOpacity="0.62" strokeWidth="2.2" className="sandbox-orbit" />
                <circle cx={server.x} cy={server.y} r="94" fill="none" stroke="#86efac" strokeOpacity="0.22" strokeWidth="2" className="sandbox-defense-ring" />
                {[0, 1, 2].map((item) => (
                  <motion.path
                    key={item}
                    d={`M ${server.x - 70 + item * 20} ${server.y - 58 + item * 12} l 14 -10 l 16 8`}
                    fill="none"
                    stroke="#86efac"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{opacity: 0, pathLength: 0}}
                    animate={{opacity: [0, 1, 0], pathLength: [0, 1, 1]}}
                    transition={{duration: 1.5, repeat: Infinity, delay: item * 0.45}}
                  />
                ))}
              </>
            )}

            <circle cx={server.x} cy={server.y} r="54" fill="url(#serverGradient)" stroke="#67e8f9" strokeWidth="2" filter="url(#softGlow)" />
            <circle cx={server.x} cy={server.y} r="72" fill="none" stroke="#22d3ee" strokeOpacity="0.18" strokeWidth="1" />

            {clients.map((client) => {
              const tone = toneStyle[client.tone as keyof typeof toneStyle];
              return (
                <g key={`node-${client.id}`}>
                  <circle cx={client.x} cy={client.y} r="29" fill={tone.fill} stroke={tone.stroke} strokeOpacity="0.85" strokeWidth="1.6" />
                  <circle cx={client.x} cy={client.y} r="37" fill="none" stroke={tone.stroke} strokeOpacity="0.16" strokeWidth="1" />
                  <text x={client.x} y={client.y + 4} textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">
                    {client.id}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-300/50 bg-slate-950/70 text-center shadow-[0_0_42px_rgba(34,211,238,0.25)]">
            <Server className="h-7 w-7 text-cyan-100" />
            <span className="mt-1 text-[10px] font-bold text-cyan-50">中央服务器</span>
          </div>

          {clients.map((client) => {
            const tone = toneStyle[client.tone as keyof typeof toneStyle];
            return (
              <div
                key={`label-${client.id}`}
                className={cn('absolute hidden -translate-x-1/2 rounded-full border bg-slate-950/70 px-2 py-1 text-[10px] font-semibold backdrop-blur md:block', tone.border, tone.text, tone.shadow)}
                style={{left: `${(client.x / 620) * 100}%`, top: `${(client.y / 470) * 100 + 8}%`}}
              >
                {client.label}
              </div>
            );
          })}
        </div>

        {isOverview ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {dataSources.map((source, index) => (
              <motion.div
                key={source.label}
                className="flex items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/45 px-4 py-3"
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: index * 0.12}}
              >
                <source.icon className={cn('h-5 w-5', source.color)} />
                <span className="text-sm font-semibold text-slate-100">{source.label}进入客户端</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-100"><UserRound className="h-4 w-4" /> 6 个良性客户端</div>
              <p className="mt-1 text-xs text-slate-300">蓝色粒子表示正常梯度/偏好更新。</p>
            </div>
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-100"><Swords className="h-4 w-4" /> 恶意更新流</div>
              <p className="mt-1 text-xs text-slate-300">红色飞线模拟目标交互注入或投毒信号。</p>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-100"><ShieldCheck className="h-4 w-4" /> 防御消散</div>
              <p className="mt-1 text-xs text-slate-300">{defenseActive ? '服务器边缘拦截并消散红色粒子。' : '无防御时服务器出现红色震荡。'}</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute right-6 top-20 text-cyan-100/60">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
