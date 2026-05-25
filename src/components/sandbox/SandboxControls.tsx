import React, {useState} from 'react';
import {ChevronDown, Database, Grid2X2, LockKeyhole, Radar, Shield, ShieldCheck, Swords} from 'lucide-react';
import {cn} from '../../lib/utils';
import {toChineseLabel} from '../../lib/showcaseFormat';
import type {ShowcaseBundle} from '../../types/showcase';

interface SandboxControlsProps {
  bundle: ShowcaseBundle;
  isLoading: boolean;
  onScenarioChange: (scenarioId: string) => void;
  defenseActive: boolean;
  onDefenseActiveChange: (active: boolean) => void;
}

const sections = [
  {
    id: 'scenario',
    title: '场景选择',
    icon: Database,
    items: ['KU / MMFedRAP 多模态主展示', 'Amazon Beauty 商品推荐', 'V2.5 目标排序推进', '模型安全能力矩阵'],
  },
  {
    id: 'poison',
    title: '投毒攻击',
    icon: Swords,
    items: ['target_interaction_injection', 'target_promotion_loss', 'target_rank_summary'],
  },
  {
    id: 'privacy',
    title: '隐私攻击',
    icon: LockKeyhole,
    items: ['membership_inference', 'interaction_reconstruction', 'proxy_only'],
  },
  {
    id: 'robust',
    title: '鲁棒防御',
    icon: Shield,
    items: ['krum', 'median', 'trimmed_mean', 'dp_noise'],
  },
  {
    id: 'secureAgg',
    title: '安全聚合',
    icon: ShieldCheck,
    items: ['secure_aggregation_sim', 'demo_only', 'not_available'],
  },
  {
    id: 'matrix',
    title: '模型能力矩阵',
    icon: Grid2X2,
    items: ['supported', 'partial', 'unsupported', 'future_adapter'],
  },
];

const findScenarioKeyword = (scenarioId: string) => {
  const lower = scenarioId.toLowerCase();
  if (lower.includes('v25')) return 'V2.5';
  if (lower.includes('amazon')) return 'Amazon';
  if (lower.includes('matrix')) return '矩阵';
  if (lower.includes('ku')) return 'KU';
  return '场景';
};

export const SandboxControls: React.FC<SandboxControlsProps> = ({
  bundle,
  isLoading,
  onScenarioChange,
  defenseActive,
  onDefenseActiveChange,
}) => {
  const [openSections, setOpenSections] = useState(() => new Set(['scenario', 'poison', 'robust']));

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <aside className="sandbox-panel sandbox-glow rounded-[24px] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/80">Control Wing</p>
          <h3 className="mt-1 text-lg font-bold text-white">攻防控制翼</h3>
        </div>
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold text-cyan-100">
          {isLoading ? '读取中' : bundle.dataSource === 'api' ? 'API' : bundle.dataSource === 'mixed' ? '混合' : 'Mock'}
        </span>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div key={section.id} className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-950/45">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-slate-100 transition hover:bg-slate-800/70"
              >
                <span className="flex items-center gap-3 text-sm font-bold">
                  <section.icon className="h-4 w-4 text-cyan-200" />
                  {section.title}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen ? 'rotate-180' : '')} />
              </button>
              {isOpen ? (
                <div className="border-t border-slate-700/50 p-3">
                  {section.id === 'scenario' ? (
                    <div className="space-y-2">
                      {bundle.scenarios.map((scenario) => {
                        const isActive = scenario.scenarioId === bundle.selectedScenario.scenarioId;
                        return (
                          <button
                            key={scenario.scenarioId}
                            type="button"
                            onClick={() => onScenarioChange(scenario.scenarioId)}
                            className={cn(
                              'w-full rounded-xl border px-3 py-2 text-left transition hover:scale-[1.01]',
                              isActive
                                ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.14)]'
                                : 'border-slate-700/40 bg-slate-900/40 text-slate-300 hover:border-cyan-300/30',
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold">{findScenarioKeyword(scenario.scenarioId)} · {scenario.name}</span>
                              <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                                {scenario.dataSource === 'api' ? 'API' : 'Mock'}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">{scenario.dataset ?? '暂无数据'} / {scenario.model ?? '暂无数据'}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div key={item} className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/50 px-3 py-2 text-xs text-slate-200">
                          <span>{toChineseLabel(item)}</span>
                          <span className="rounded-full border border-slate-600/60 px-2 py-0.5 text-[10px] text-slate-400">artifact</span>
                        </div>
                      ))}
                      {section.id === 'robust' ? (
                        <button
                          type="button"
                          onClick={() => onDefenseActiveChange(!defenseActive)}
                          className={cn(
                            'mt-2 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition',
                            defenseActive
                              ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
                              : 'border-rose-300/40 bg-rose-300/10 text-rose-100',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Radar className="h-3.5 w-3.5" />
                            防御视觉
                          </span>
                          <span>{defenseActive ? '已开启' : '未开启'}</span>
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
