export type ExperimentMetricName = 'recall' | 'ndcg';
export type ExperimentMetricCutoff = 20 | 50;

interface BestMetricInput {
  finalEval?: unknown;
  metadata?: Record<string, unknown>;
  roundSummaries?: unknown[];
  roundMetrics?: unknown[];
  metric: ExperimentMetricName;
  cutoff: ExperimentMetricCutoff;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asFiniteNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const normalizeMetricKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

export const readExperimentMetricValue = (
  source: unknown,
  metric: ExperimentMetricName,
  cutoff: ExperimentMetricCutoff,
) => {
  if (!isRecord(source)) {
    return undefined;
  }

  const targetKey = `${metric}${cutoff}`;
  for (const [key, value] of Object.entries(source)) {
    if (normalizeMetricKey(key) === targetKey) {
      const parsed = asFiniteNumber(value);
      if (parsed !== undefined) {
        return parsed;
      }
    }
  }

  const extra = source.extra;
  if (extra && extra !== source) {
    return readExperimentMetricValue(extra, metric, cutoff);
  }

  return undefined;
};

const readNested = (source: unknown, path: string[]) =>
  path.reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }
    return current[key];
  }, source);

export const getExplicitMainMetricKey = (metadata?: Record<string, unknown>) => {
  const candidatePaths = [
    ['valid_metric'],
    ['validMetric'],
    ['training_config', 'valid_metric'],
    ['training_config', 'validMetric'],
    ['trainingConfig', 'valid_metric'],
    ['trainingConfig', 'validMetric'],
    ['mapped_config', 'valid_metric'],
    ['mapped_config', 'validMetric'],
    ['config', 'valid_metric'],
    ['config', 'validMetric'],
  ];

  for (const path of candidatePaths) {
    const value = readNested(metadata, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const collectMetricFromSources = (
  sources: unknown[],
  metric: ExperimentMetricName,
  cutoff: ExperimentMetricCutoff,
) =>
  sources
    .map((source) => readExperimentMetricValue(source, metric, cutoff))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

const collectRoundMetricValues = (
  roundMetrics: unknown[] | undefined,
  metric: ExperimentMetricName,
  cutoff: ExperimentMetricCutoff,
) => {
  const values: number[] = [];

  for (const round of roundMetrics ?? []) {
    if (!isRecord(round)) {
      continue;
    }

    const extra = isRecord(round.extra) ? round.extra : undefined;
    values.push(
      ...collectMetricFromSources(
        [
          round,
          round.valid_result,
          round.test_result,
          round.best_valid_result,
          round.best_test_result,
          extra,
          extra?.valid_result,
          extra?.test_result,
          extra?.best_valid_result,
          extra?.best_test_result,
        ],
        metric,
        cutoff,
      ),
    );
  }

  return values;
};

const collectRoundSummaryScoreValues = (
  metadata: Record<string, unknown> | undefined,
  roundSummaries: unknown[] | undefined,
  metric: ExperimentMetricName,
  cutoff: ExperimentMetricCutoff,
) => {
  const explicitMetric = getExplicitMainMetricKey(metadata);
  if (normalizeMetricKey(explicitMetric ?? '') !== `${metric}${cutoff}`) {
    return [];
  }

  return (roundSummaries ?? [])
    .flatMap((round) => {
      if (!isRecord(round)) {
        return [];
      }
      return [asFiniteNumber(round.valid_score), asFiniteNumber(round.test_score)];
    })
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
};

export const getBestExperimentMetric = ({
  finalEval,
  metadata,
  roundSummaries,
  roundMetrics,
  metric,
  cutoff,
}: BestMetricInput) => {
  const explicitBestValues = collectMetricFromSources(
    [
      metadata?.best_test_result,
      metadata?.bestTestResult,
      metadata?.best_valid_result,
      metadata?.bestValidResult,
      metadata?.best_result,
      metadata?.bestResult,
      metadata?.final_result,
      metadata?.finalResult,
    ],
    metric,
    cutoff,
  );

  const roundValues = [
    ...collectRoundMetricValues(roundMetrics, metric, cutoff),
    ...collectRoundSummaryScoreValues(metadata, roundSummaries, metric, cutoff),
  ];

  // Round-level metrics are the source of truth for "best over the whole run".
  // Some result files expose final/best snapshots that can be stale or not the
  // maximum round value, so compare them instead of trusting the first snapshot.
  if (roundValues.length) {
    return Math.max(...roundValues, ...explicitBestValues);
  }

  if (explicitBestValues.length) {
    return Math.max(...explicitBestValues);
  }

  const finalValues = collectMetricFromSources(
    [
      finalEval,
      isRecord(finalEval) ? finalEval.extra : undefined,
      metadata?.final_eval,
      metadata?.finalEval,
    ],
    metric,
    cutoff,
  );

  return finalValues.length ? Math.max(...finalValues) : undefined;
};
