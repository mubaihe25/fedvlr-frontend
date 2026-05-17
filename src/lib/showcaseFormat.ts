import type {
  ShowcaseDatasetProfile,
  ShowcaseRecommendationComparison,
  ShowcaseReport,
  ShowcaseScenario,
} from '../types/showcase';

export const EMPTY_VALUE = '暂无 / 不适用';

export const formatMetricValue = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : EMPTY_VALUE;

export const formatPercentValue = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value * 100)}%` : EMPTY_VALUE;

export const formatPlainValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return EMPTY_VALUE;
  }

  return String(value);
};

export const summarizeArtifactValue = (value: unknown): string => {
  if (value === null || value === undefined || value === false) {
    return EMPTY_VALUE;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length ? value.slice(0, 4).map(summarizeArtifactValue).join(' / ') : EMPTY_VALUE;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 4);
    return entries.length ? entries.map(([key, item]) => `${key}: ${summarizeArtifactValue(item)}`).join(' / ') : EMPTY_VALUE;
  }

  return EMPTY_VALUE;
};

export const getDatasetLabel = (dataset?: ShowcaseDatasetProfile | null) =>
  dataset?.dataset ?? dataset?.name ?? EMPTY_VALUE;

export const getRecommendationCounts = (comparison?: ShowcaseRecommendationComparison | null) => ({
  baseline: comparison?.baseline.length ?? 0,
  attack: comparison?.attack.length ?? 0,
  defense: comparison?.defense.length ?? 0,
});

export const getBoundaryItems = (report: ShowcaseReport, scenario?: ShowcaseScenario) => {
  const items = [...(report.boundaries ?? [])];
  const hasFlag = (key: keyof Pick<ShowcaseReport, 'smoke' | 'proxy' | 'demo' | 'demoOnly' | 'unavailable' | 'notAvailable'>) =>
    Boolean(report[key] ?? scenario?.[key]);

  if (hasFlag('smoke')) {
    items.push('smoke：只读安全冒烟验证结果，不能当作完整训练结论。');
  }
  if (hasFlag('proxy')) {
    items.push('proxy：部分字段来自代理/替代 artifact，不代表完整实现链路。');
  }
  if (hasFlag('demo') || hasFlag('demoOnly')) {
    items.push('demo_only：用于展示结构和解释链路，不等同于生产级能力。');
  }
  if (hasFlag('unavailable') || hasFlag('notAvailable')) {
    items.push('not_available：当前场景未导出该模块 artifact。');
  }
  items.push('URL-hash placeholder：Amazon image_features 若标记为 URL-hash，仅是占位特征，不是真实视觉 embedding。');
  items.push('secure aggregation simulation only：安全聚合如出现仅为模拟/占位说明，不是正式安全聚合实现。');
  items.push('DP-style noise without formal accountant：DP 风格噪声没有正式隐私会计，不应写成差分隐私已实现。');

  return Array.from(new Set(items));
};

export const hasAmazonUrlHashPlaceholder = (dataset?: ShowcaseDatasetProfile | null, scenario?: ShowcaseScenario) => {
  const text = [dataset?.dataset, dataset?.name, dataset?.source, dataset?.imageFeatureMethod, scenario?.dataset, scenario?.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return text.includes('amazon') || (text.includes('url') && text.includes('hash'));
};
