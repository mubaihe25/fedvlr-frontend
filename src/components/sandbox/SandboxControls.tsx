import React, {useState} from 'react';
import {ChevronDown, Database, LockKeyhole, Radar, Shield, ShieldCheck, Swords} from 'lucide-react';
import {cn} from '../../lib/utils';
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
    title: '选择实验剧本',
    icon: Database,
    items: ['KU 多模态主展示', 'Amazon 商品安全分析', 'V2.5 目标排序推进', 'Krum 鲁棒防御链路'],
  },
  {
    id: 'poison',
    title: '投毒攻击',
    icon: Swords,
    items: ['目标商品投毒', '目标交互注入', '排序推进诊断'],
  },
  {
    id: 'privacy',
    title: '隐私攻击',
    icon: LockKeyhole,
    items: ['成员推断攻击', '交互候选还原', '代理证据'],
  },
  {
    id: 'robust',
    title: '鲁棒聚合防御',
    icon: Shield,
    items: ['Krum 选择与拒绝', 'Median 聚合', 'TrimmedMean 聚合', '差分隐私风格加噪'],
  },
  {
    id: 'secureAgg',
    title: '安全聚合模拟',
    icon: ShieldCheck,
    items: ['安全聚合模拟', '残差校验', '演示验证边界'],
  },
];

const findScenarioKeyword = (scenarioId: string) => {
  const lower = scenarioId.toLowerCase();
  if (lower.includes('v25')) return 'V2.5';
  if (lower.includes('amazon')) return 'Amazon';
  if (lower.includes('matrix')) return '能力矩阵';
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
    <aside className="sandbox-panel rounded-[24px] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-100/75">实验剧本</p>
          <h3 className="mt-1 text-lg font-bold text-white">攻防控制台</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[11px] font-bold text-slate-300">
          {isLoading ? '读取中' : bundle.dataSource === 'api' ? 'API' : bundle.dataSource === 'mixed' ? '部分缺失' : '演示'}
        </span>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div key={section.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-slate-100 transition hover:bg-white/[0.06]"
              >
                <span className="flex items-center gap-3 text-sm font-bold">
                  <section.icon className="h-4 w-4 text-cyan-100" />
                  {section.title}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen ? 'rotate-180' : '')} />
              </button>
              {isOpen ? (
                <div className="border-t border-white/10 p-3">
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
                                ? 'border-cyan-200/45 bg-cyan-200/10 text-cyan-50'
                                : 'border-white/10 bg-slate-900/25 text-slate-300 hover:border-cyan-200/25',
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold">{findScenarioKeyword(scenario.scenarioId)} 线</span>
                              <span className="shrink-0 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                                {scenario.dataSource === 'api' ? 'API' : '演示'}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-[11px] text-slate-400">{scenario.name}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div key={item} className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/28 px-3 py-2 text-xs text-slate-200">
                          <span>{item}</span>
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">证据</span>
                        </div>
                      ))}
                      {section.id === 'robust' ? (
                        <button
                          type="button"
                          onClick={() => onDefenseActiveChange(!defenseActive)}
                          className={cn(
                            'mt-2 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition',
                            defenseActive
                              ? 'border-emerald-200/35 bg-emerald-200/10 text-emerald-100'
                              : 'border-rose-200/35 bg-rose-200/10 text-rose-100',
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
