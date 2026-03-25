import React, {useEffect, useMemo, useState} from 'react';
import {ChevronDown, Cpu, Info, Settings, ShieldAlert} from 'lucide-react';
import {mockConfigurationData} from '../../mock/configuration';
import type {AsyncState} from '../../types/common';
import type {TrainConfig} from '../../types/train';
import {cn} from '../../lib/utils';
import type {StartTrainResponse} from '../../services/train';

interface ConfigurationProps {
  draftConfig: TrainConfig;
  onDraftConfigChange: (config: TrainConfig) => void;
  onStartTrain: (config: TrainConfig) => Promise<StartTrainResponse>;
}

const cloneConfig = (config: TrainConfig) => structuredClone(config);

const createResetConfig = (): TrainConfig => ({
  ...cloneConfig(mockConfigurationData.defaultConfig),
  mode: 'baseline',
  attackEnabled: false,
  attackType: 'none',
  defenseEnabled: false,
  defenseType: 'none',
});

export const Configuration: React.FC<ConfigurationProps> = ({
  draftConfig,
  onDraftConfigChange,
  onStartTrain,
}) => {
  const [formConfig, setFormConfig] = useState<TrainConfig>(() => cloneConfig(draftConfig));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitState, setSubmitState] = useState<AsyncState>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormConfig(cloneConfig(draftConfig));
  }, [draftConfig]);

  const summary = useMemo(() => mockConfigurationData.buildSummary(formConfig), [formConfig]);

  const updateConfig = (updater: (current: TrainConfig) => TrainConfig) => {
    setFormConfig((current) => {
      const next = updater(current);
      onDraftConfigChange(next);
      return next;
    });
  };

  const handleModeChange = (mode: TrainConfig['mode']) => {
    updateConfig((current) => {
      if (mode === 'baseline') {
        return {...current, mode, attackEnabled: false, attackType: 'none', defenseEnabled: false, defenseType: 'none'};
      }

      if (mode === 'attack') {
        return {
          ...current,
          mode,
          attackEnabled: true,
          attackType: current.attackType === 'none' ? 'label-flipping' : current.attackType,
          defenseEnabled: false,
          defenseType: 'none',
        };
      }

      return {
        ...current,
        mode,
        attackEnabled: true,
        attackType: current.attackType === 'none' ? 'label-flipping' : current.attackType,
        defenseEnabled: true,
        defenseType: current.defenseType === 'none' ? 'cyber-shield' : current.defenseType,
      };
    });
  };

  const handleDefault = () => {
    const next = cloneConfig(mockConfigurationData.defaultConfig);
    setFormConfig(next);
    onDraftConfigChange(next);
    setMessage('已加载推荐默认配置。');
  };

  const handleReset = () => {
    const next = createResetConfig();
    setFormConfig(next);
    onDraftConfigChange(next);
    setMessage('已重置为基线实验配置。');
  };

  const handleStart = async () => {
    try {
      setSubmitState('loading');
      const response = await onStartTrain(formConfig);
      setSubmitState('success');
      setMessage(response.message);
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : '训练任务创建失败。');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-primary">Environment Setup</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-background">训练实验配置</h3>
          <p className="mt-3 text-sm text-on-surface-variant">
            本页使用 mock 数据与统一类型定义驱动，后续可直接替换为真实后端接口。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDefault}
            className="rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface"
          >
            加载默认
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface"
          >
            重置配置
          </button>
          <button
            onClick={handleStart}
            disabled={submitState === 'loading'}
            className="rounded-lg bg-gradient-to-br from-primary to-secondary px-8 py-2.5 text-sm font-bold text-surface shadow-[0_0_20px_rgba(129,236,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(129,236,255,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitState === 'loading' ? '正在启动...' : '开始训练'}
          </button>
        </div>
      </div>

      {message ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            submitState === 'error'
              ? 'border-error/30 bg-error/10 text-error'
              : 'border-primary/20 bg-primary/10 text-on-surface',
          )}
        >
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="glass-panel rounded-xl p-6 space-y-6">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-bold">基础运行配置</h4>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">数据集</label>
                <div className="relative">
                  <select
                    value={formConfig.dataset}
                    onChange={(event) => updateConfig((current) => ({...current, dataset: event.target.value}))}
                    className="w-full appearance-none rounded-lg border-none bg-surface-container-highest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-primary"
                  >
                    {mockConfigurationData.datasetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">模型 / 算法</label>
                <div className="relative">
                  <select
                    value={formConfig.model}
                    onChange={(event) => updateConfig((current) => ({...current, model: event.target.value}))}
                    className="w-full appearance-none rounded-lg border-none bg-surface-container-highest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-primary"
                  >
                    {mockConfigurationData.modelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">实验模式</label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {mockConfigurationData.modeOptions.map((option) => {
                    const isActive = formConfig.mode === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleModeChange(option.value)}
                        className={cn(
                          'rounded-lg border px-4 py-3 text-sm font-medium transition-all',
                          isActive
                            ? 'border-primary/40 bg-surface-container-highest text-primary shadow-[inset_0_0_10px_rgba(129,236,255,0.1)]'
                            : 'border-transparent bg-surface-container-highest text-on-surface-variant hover:border-primary/30 hover:text-on-surface',
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <div className="mb-6 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-tertiary" />
              <h4 className="text-lg font-bold">超参数设定</h4>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">学习率</label>
                  <span className="font-mono text-sm text-primary">{formConfig.learningRate.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.0005"
                  max="0.005"
                  step="0.0001"
                  value={formConfig.learningRate}
                  onChange={(event) =>
                    updateConfig((current) => ({...current, learningRate: Number(event.target.value)}))
                  }
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">总训练轮数</label>
                  <span className="font-mono text-sm text-primary">{formConfig.totalRounds}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={formConfig.totalRounds}
                  onChange={(event) =>
                    updateConfig((current) => ({...current, totalRounds: Number(event.target.value)}))
                  }
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">客户端采样率</label>
                  <span className="font-mono text-sm text-primary">{Math.round(formConfig.clientSamplingRate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={formConfig.clientSamplingRate}
                  onChange={(event) =>
                    updateConfig((current) => ({...current, clientSamplingRate: Number(event.target.value)}))
                  }
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-on-surface-variant">客户端数量</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={formConfig.clientCount}
                  onChange={(event) =>
                    updateConfig((current) => ({...current, clientCount: Number(event.target.value)}))
                  }
                  className="w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 font-mono text-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-outline-variant/10 bg-surface-container-low">
              <button
                onClick={() => setShowAdvanced((current) => !current)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-bold">高级参数</p>
                  <p className="text-xs text-on-surface-variant">本地训练轮数、优化器、安全聚合与差分隐私配置</p>
                </div>
                <ChevronDown
                  className={cn('h-4 w-4 text-on-surface-variant transition-transform', showAdvanced && 'rotate-180')}
                />
              </button>
              {showAdvanced ? (
                <div className="grid grid-cols-1 gap-6 border-t border-outline-variant/10 px-5 py-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">本地训练轮数</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formConfig.advanced.localEpochs}
                      onChange={(event) =>
                        updateConfig((current) => ({
                          ...current,
                          advanced: {...current.advanced, localEpochs: Number(event.target.value)},
                        }))
                      }
                      className="w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 font-mono text-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">优化器</label>
                    <div className="relative">
                      <select
                        value={formConfig.advanced.optimizer}
                        onChange={(event) =>
                          updateConfig((current) => ({
                            ...current,
                            advanced: {...current.advanced, optimizer: event.target.value as TrainConfig['advanced']['optimizer']},
                          }))
                        }
                        className="w-full appearance-none rounded-lg border-none bg-surface-container-highest px-4 py-3 text-on-surface transition-all focus:ring-1 focus:ring-primary"
                      >
                        <option value="adam">Adam</option>
                        <option value="adamw">AdamW</option>
                        <option value="sgd">SGD</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">差分隐私 ε</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formConfig.advanced.differentialPrivacyEpsilon ?? 0}
                      onChange={(event) =>
                        updateConfig((current) => ({
                          ...current,
                          advanced: {
                            ...current.advanced,
                            differentialPrivacyEpsilon: Number(event.target.value) || null,
                          },
                        }))
                      }
                      className="w-full rounded-lg border-none bg-surface-container-highest px-4 py-2 font-mono text-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">安全聚合</label>
                    <button
                      onClick={() =>
                        updateConfig((current) => ({
                          ...current,
                          advanced: {
                            ...current.advanced,
                            secureAggregation: !current.advanced.secureAggregation,
                          },
                        }))
                      }
                      className={cn(
                        'w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all',
                        formConfig.advanced.secureAggregation
                          ? 'bg-tertiary/10 text-tertiary'
                          : 'bg-surface-container-highest text-on-surface-variant',
                      )}
                    >
                      {formConfig.advanced.secureAggregation ? '已启用安全聚合' : '当前未启用安全聚合'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="overflow-hidden rounded-xl glass-panel">
            <div className="border-b border-error/20 bg-error/10 p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-error" />
                <h4 className="font-bold text-error">攻防策略配置</h4>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">攻击类型</label>
                <div className="flex flex-wrap gap-2">
                  {mockConfigurationData.attackOptions
                    .filter((option) => option.value !== 'none')
                    .map((option) => {
                      const isActive = formConfig.attackEnabled && formConfig.attackType === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            updateConfig((current) => ({
                              ...current,
                              attackEnabled: true,
                              attackType: option.value,
                            }))
                          }
                          className={cn(
                            'rounded px-3 py-1 text-[11px] font-bold transition-all',
                            isActive
                              ? 'border border-error/20 bg-error/10 text-error'
                              : 'bg-surface-container-highest text-on-surface-variant',
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">攻击比率</label>
                <div className="flex items-center gap-4">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-low">
                    <div className="h-full bg-error" style={{width: `${Math.round(formConfig.poisoningRatio * 100)}%`}} />
                  </div>
                  <span className="font-mono text-sm text-error">{Math.round(formConfig.poisoningRatio * 100)}%</span>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">防御机制</label>
                <div className="flex flex-wrap gap-2">
                  {mockConfigurationData.defenseOptions
                    .filter((option) => option.value !== 'none')
                    .slice(0, 4)
                    .map((option) => {
                      const isActive = formConfig.defenseEnabled && formConfig.defenseType === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            updateConfig((current) => ({
                              ...current,
                              defenseEnabled: true,
                              defenseType: option.value,
                            }))
                          }
                          className={cn(
                            'rounded px-3 py-1 text-[11px] font-bold transition-all',
                            isActive
                              ? 'border border-tertiary/20 bg-tertiary/10 text-tertiary'
                              : 'bg-surface-container-highest text-on-surface-variant',
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl border-l-4 border-primary p-6">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">实验概览</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">实验模式</span>
                <span className="font-mono text-on-surface">{summary.modeLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">预计训练时长</span>
                <span className="font-mono text-on-surface">{summary.estimatedDuration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">资源预估</span>
                <span className="font-mono text-on-surface">{summary.resourceEstimate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">隐私保护强度</span>
                <span className="rounded bg-tertiary/20 px-2 py-0.5 text-[10px] font-bold text-tertiary">{summary.privacyLevel.toUpperCase()}</span>
              </div>
            </div>
            <div className="relative mt-8 overflow-hidden rounded-lg border border-primary/10 aspect-video">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(129,236,255,0.18),_transparent_45%),linear-gradient(135deg,#0c141b,#172129)]" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-surface-container to-transparent p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">Topology Preview</p>
                <p className="text-xs text-on-surface/80">{summary.topologyPreview}</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-surface-container-low p-4 text-xs text-on-surface-variant">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-primary" />
                <span>{formConfig.advanced.notes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
