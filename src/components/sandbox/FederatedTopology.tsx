import React from 'react';
import {motion} from 'motion/react';
import {Database, FileText, Image, Server, ShieldCheck, Swords, UserRound} from 'lucide-react';
import {cn} from '../../lib/utils';

interface FederatedTopologyProps {
  mode?: 'overview' | 'exercise';
  defenseActive?: boolean;
  className?: string;
}

const clients = [
  {id: 'C1', x: 110, y: 70, tone: 'benign', label: '图文偏好', delay: 0.05},
  {id: 'C2', x: 330, y: 54, tone: 'benign', label: '文本兴趣', delay: 0.18},
  {id: 'C3', x: 515, y: 128, tone: 'malicious', label: '投毒客户端', delay: 0.28},
  {id: 'C4', x: 560, y: 324, tone: 'benign', label: '交互历史', delay: 0.4},
  {id: 'C5', x: 358, y: 420, tone: 'defense', label: '防御恢复', delay: 0.54},
  {id: 'C6', x: 110, y: 382, tone: 'benign', label: '商品图文', delay: 0.66},
  {id: 'C7', x: 50, y: 226, tone: 'malicious', label: '异常更新', delay: 0.78},
] as const;

const server = {x: 310, y: 235};

const toneStyle = {
  benign: {
    stroke: '#38bdf8',
    glow: 'rgba(56,189,248,0.28)',
    fill: 'bg-sky-200/12',
    border: 'border-sky-200/45',
    text: 'text-sky-100',
    label: '正常更新',
  },
  malicious: {
    stroke: '#fb7185',
    glow: 'rgba(251,113,133,0.35)',
    fill: 'bg-rose-200/12',
    border: 'border-rose-200/55',
    text: 'text-rose-100',
    label: '恶意更新',
  },
  defense: {
    stroke: '#86efac',
    glow: 'rgba(134,239,172,0.32)',
    fill: 'bg-emerald-200/12',
    border: 'border-emerald-200/50',
    text: 'text-emerald-100',
    label: '防御恢复',
  },
} as const;

const dataSources = [
  {label: '图片', icon: Image, color: 'text-sky-100'},
  {label: '文本', icon: FileText, color: 'text-violet-100'},
  {label: '交互记录', icon: Database, color: 'text-emerald-100'},
];

const curvePath = (client: (typeof clients)[number]) => {
  const midX = (client.x + server.x) / 2;
  const midY = (client.y + server.y) / 2;
  const bend = client.tone === 'malicious' ? -18 : client.tone === 'defense' ? 18 : 0;
  return `M ${client.x} ${client.y} C ${midX + bend} ${midY - 38}, ${midX - bend} ${midY + 38}, ${server.x} ${server.y}`;
};

export const FederatedTopology: React.FC<FederatedTopologyProps> = ({mode = 'exercise', defenseActive = true, className}) => {
  const isOverview = mode === 'overview';

  return (
    <div className={cn('sandbox-panel relative overflow-hidden rounded-[28px] p-4', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_66%_60%,rgba(16,185,129,0.08),transparent_30%),linear-gradient(135deg,rgba(30,41,59,0.36),rgba(15,23,42,0.68))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:34px_34px]" />

      <div className="relative z-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">联邦拓扑沙盘</p>
            <h3 className="mt-1 text-xl font-bold text-white">{isOverview ? '数据本地训练，服务端只聚合更新' : '训练、上传、聚合与防御过滤'}</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-full border border-sky-200/25 bg-sky-200/10 px-3 py-1 text-sky-100">蓝色：正常更新</span>
            <span className="rounded-full border border-rose-200/25 bg-rose-200/10 px-3 py-1 text-rose-100">红色：恶意投毒</span>
            <span className="rounded-full border border-emerald-200/25 bg-emerald-200/10 px-3 py-1 text-emerald-100">绿色：防御恢复</span>
          </div>
        </div>

        <div className="relative mx-auto aspect-[1.32/1] w-full max-w-[760px]">
          <svg viewBox="0 0 620 470" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <filter id="fedvlrSoftGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="fedvlrServerGradient">
                <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.95" />
                <stop offset="42%" stopColor="#38bdf8" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.28" />
              </radialGradient>
              <marker id="flowArrowSky" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" opacity="0.62" />
              </marker>
              <marker id="flowArrowRose" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#fb7185" opacity="0.72" />
              </marker>
              <marker id="flowArrowEmerald" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#86efac" opacity="0.7" />
              </marker>
            </defs>

            {clients.map((client, index) => {
              const tone = toneStyle[client.tone];
              const path = curvePath(client);
              const markerId = client.tone === 'malicious' ? 'flowArrowRose' : client.tone === 'defense' ? 'flowArrowEmerald' : 'flowArrowSky';
              const intercepted = defenseActive && client.tone === 'malicious';

              return (
                <g key={client.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke={tone.stroke}
                    strokeOpacity={client.tone === 'malicious' ? 0.32 : 0.22}
                    strokeWidth={client.tone === 'malicious' ? 1.8 : 1.35}
                    markerEnd={`url(#${markerId})`}
                  />
                  <motion.path
                    d={path}
                    fill="none"
                    stroke={tone.stroke}
                    strokeWidth={client.tone === 'malicious' ? 2.3 : 1.7}
                    strokeLinecap="round"
                    strokeDasharray={client.tone === 'malicious' ? '10 22' : '8 26'}
                    filter="url(#fedvlrSoftGlow)"
                    initial={{strokeDashoffset: 0, opacity: 0.48}}
                    animate={{strokeDashoffset: -170, opacity: [0.35, 0.92, 0.35]}}
                    transition={{strokeDashoffset: {duration: client.tone === 'malicious' ? 1.9 : 3.1, repeat: Infinity, ease: 'linear', delay: client.delay}, opacity: {duration: 3, repeat: Infinity, ease: 'easeInOut', delay: client.delay}}}
                  />
                  <motion.circle
                    r={client.tone === 'malicious' ? 4.4 : 3.8}
                    fill={tone.stroke}
                    filter="url(#fedvlrSoftGlow)"
                    initial={{offsetDistance: '0%', opacity: 0}}
                    animate={{offsetDistance: intercepted ? ['0%', '76%', '82%'] : ['0%', '100%'], opacity: intercepted ? [0, 0.95, 0] : [0, 0.85, 0]}}
                    style={{offsetPath: `path("${path}")`}}
                    transition={{duration: client.tone === 'malicious' ? 2 : 3.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.16}}
                  />
                </g>
              );
            })}

            {defenseActive ? (
              <>
                <circle cx={server.x} cy={server.y} r="78" fill="none" stroke="#86efac" strokeOpacity="0.5" strokeWidth="2" className="sandbox-orbit" />
                <circle cx={server.x} cy={server.y} r="94" fill="none" stroke="#86efac" strokeOpacity="0.16" strokeWidth="2" className="sandbox-defense-ring" />
                <motion.circle
                  cx={server.x}
                  cy={server.y}
                  r="86"
                  fill="none"
                  stroke="#86efac"
                  strokeDasharray="36 160"
                  strokeLinecap="round"
                  strokeOpacity="0.7"
                  strokeWidth="3"
                  style={{transformOrigin: `${server.x}px ${server.y}px`}}
                  animate={{rotate: [0, 360], opacity: [0.45, 0.88, 0.45]}}
                  transition={{rotate: {duration: 5.4, repeat: Infinity, ease: 'linear'}, opacity: {duration: 2.6, repeat: Infinity, ease: 'easeInOut'}}}
                />
                {[0, 1, 2, 3].map((item) => (
                  <motion.circle
                    key={`intercept-${item}`}
                    cx={server.x + 64 + item * 4}
                    cy={server.y - 26 + item * 14}
                    r="2"
                    fill="#fb7185"
                    filter="url(#fedvlrSoftGlow)"
                    initial={{opacity: 0, scale: 0.4}}
                    animate={{opacity: [0, 0.9, 0], scale: [0.4, 1.8, 0.2], x: [0, 10 + item * 3, 18 + item * 5], y: [0, -8 + item * 4, -18 + item * 6]}}
                    transition={{duration: 1.7, repeat: Infinity, delay: item * 0.28, ease: 'easeOut'}}
                  />
                ))}
                {[0, 1, 2, 3, 4, 5].map((item) => {
                  const angle = -42 + item * 8;
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <motion.circle
                      key={`dissolve-${item}`}
                      cx={server.x + Math.cos(rad) * 78}
                      cy={server.y + Math.sin(rad) * 78}
                      r="2.4"
                      fill={item % 2 ? '#fecdd3' : '#fb7185'}
                      filter="url(#fedvlrSoftGlow)"
                      initial={{opacity: 0, scale: 0.4}}
                      animate={{
                        opacity: [0, 0.95, 0],
                        scale: [0.4, 1.2, 0.1],
                        x: [0, Math.cos(rad) * 18, Math.cos(rad) * 32],
                        y: [0, Math.sin(rad) * 18, Math.sin(rad) * 32],
                      }}
                      transition={{duration: 1.55, repeat: Infinity, delay: 0.18 + item * 0.12, ease: 'easeOut'}}
                    />
                  );
                })}
                {[0, 1, 2].map((item) => (
                  <motion.path
                    key={item}
                    d={`M ${server.x - 66 + item * 18} ${server.y - 48 + item * 13} l 13 -9 l 16 8`}
                    fill="none"
                    stroke="#86efac"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{opacity: 0, pathLength: 0}}
                    animate={{opacity: [0, 1, 0], pathLength: [0, 1, 1]}}
                    transition={{duration: 1.6, repeat: Infinity, delay: item * 0.42}}
                  />
                ))}
              </>
            ) : (
              <>
                <circle cx={server.x} cy={server.y} r="66" fill="none" stroke="#fb7185" strokeOpacity="0.34" strokeWidth="2" className="sandbox-defense-ring" />
                <circle cx={server.x} cy={server.y} r="92" fill="none" stroke="#fb7185" strokeOpacity="0.17" strokeWidth="2" className="sandbox-defense-ring" />
              </>
            )}

            <motion.circle
              cx={server.x}
              cy={server.y}
              r="58"
              fill="url(#fedvlrServerGradient)"
              stroke="#7dd3fc"
              strokeWidth="2"
              filter="url(#fedvlrSoftGlow)"
              style={{transformOrigin: `${server.x}px ${server.y}px`}}
              animate={{scale: [0.94, 1.04, 0.94], opacity: [0.82, 1, 0.82]}}
              transition={{duration: 4.2, repeat: Infinity, ease: 'easeInOut'}}
            />
            <motion.circle
              cx={server.x}
              cy={server.y}
              r="80"
              fill="none"
              stroke="#38bdf8"
              strokeOpacity="0.18"
              strokeWidth="1"
              style={{transformOrigin: `${server.x}px ${server.y}px`}}
              animate={{scale: [0.92, 1.15, 0.92], opacity: [0.1, 0.28, 0.1]}}
              transition={{duration: 4.8, repeat: Infinity, ease: 'easeInOut'}}
            />
          </svg>

          <motion.div
            className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-200/45 bg-slate-950/68 text-center shadow-[0_0_46px_rgba(56,189,248,0.28)]"
            animate={{boxShadow: ['0 0 28px rgba(56,189,248,0.18)', '0 0 58px rgba(56,189,248,0.36)', '0 0 28px rgba(56,189,248,0.18)']}}
            transition={{duration: 4.4, repeat: Infinity, ease: 'easeInOut'}}
          >
            <Server className="h-7 w-7 text-cyan-100" />
            <span className="mt-1 text-[10px] font-bold text-cyan-50">服务端聚合</span>
          </motion.div>

          {clients.map((client) => {
            const tone = toneStyle[client.tone];
            return (
              <motion.div
                key={client.id}
                className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{left: `${(client.x / 620) * 100}%`, top: `${(client.y / 470) * 100}%`}}
                animate={{y: [0, -6, 0], scale: [1, 1.025, 1]}}
                transition={{duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: client.delay}}
              >
                <button
                  type="button"
                  className={cn('flex h-14 w-14 items-center justify-center rounded-full border text-sm font-black text-white shadow-lg backdrop-blur-xl transition group-hover:scale-110', tone.fill, tone.border)}
                  style={{boxShadow: `0 0 24px ${tone.glow}`}}
                >
                  {client.id}
                </button>
                <div className={cn('pointer-events-none absolute left-1/2 top-16 w-48 -translate-x-1/2 rounded-2xl border bg-slate-950/90 p-3 text-left opacity-0 shadow-2xl backdrop-blur-xl transition group-hover:opacity-100', tone.border)}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{client.label}</span>
                    <span className={cn('text-[10px] font-bold', tone.text)}>{tone.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {dataSources.map((source) => (
                      <div key={source.label} className="rounded-xl bg-white/[0.06] px-2 py-2 text-center">
                        <source.icon className={cn('mx-auto h-4 w-4', source.color)} />
                        <span className="mt-1 block text-[10px] font-semibold text-slate-200">{source.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {isOverview ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {dataSources.map((source, index) => (
              <motion.div
                key={source.label}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3"
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
            <div className="rounded-2xl border border-sky-200/20 bg-sky-200/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-sky-100">
                <UserRound className="h-4 w-4" />
                客户端本地训练
              </div>
              <p className="mt-1 text-xs text-slate-300">蓝色粒子表示本地训练后的模型更新。</p>
            </div>
            <div className="rounded-2xl border border-rose-200/20 bg-rose-200/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-100">
                <Swords className="h-4 w-4" />
                恶意更新上传
              </div>
              <p className="mt-1 text-xs text-slate-300">红色飞线表示目标投毒或异常更新。</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/20 bg-emerald-200/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                防御过滤
              </div>
              <p className="mt-1 text-xs text-slate-300">{defenseActive ? '绿色环在服务端边缘拦截并消散异常流。' : '无防御时服务端出现红色风险波纹。'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
