import {createExperimentResult, mockAnalysisData} from '../mock/analysis';
import {mockComparisonData} from '../mock/comparison';
import {defaultTrainConfig} from '../mock/configuration';
import {initialHistoryRecords} from '../mock/history';
import {createTaskStatusSnapshot, mockMonitoringData} from '../mock/monitoring';
import type {HistoryRecord} from '../types/history';
import type {ComparisonResult, ComparisonGroup, ExperimentResult} from '../types/result';
import type {TaskStatusResponse} from '../types/task';
import type {TrainConfig} from '../types/train';

const taskConfigs = new Map<string, TrainConfig>();
const taskSnapshots = new Map<string, TaskStatusResponse>();
const taskResults = new Map<string, ExperimentResult>();
let historyRecords = structuredClone(initialHistoryRecords);

for (const record of historyRecords) {
  taskConfigs.set(record.taskId, structuredClone(record.config));
}

taskConfigs.set('task-running-demo', structuredClone(defaultTrainConfig));
taskConfigs.set('task-completed-demo', structuredClone(defaultTrainConfig));
taskConfigs.set('task-failed-demo', structuredClone(defaultTrainConfig));

taskSnapshots.set('task-running-demo', structuredClone(mockMonitoringData.seededTasks['task-running-demo']));
taskSnapshots.set('task-completed-demo', structuredClone(mockMonitoringData.seededTasks['task-completed-demo']));
taskSnapshots.set('task-failed-demo', structuredClone(mockMonitoringData.seededTasks['task-failed-demo']));

taskResults.set(mockAnalysisData.currentResult.taskId, structuredClone(mockAnalysisData.currentResult));
taskResults.set(mockAnalysisData.historyFallback.taskId, structuredClone(mockAnalysisData.historyFallback));
taskResults.set('comparison-task-demo', createExperimentResult('comparison-task-demo', historyRecords[3].config, 'history'));

const findHistoryRecord = (id: string) => historyRecords.find((record) => record.id === id) ?? null;

const createComparisonGroupFromHistory = (record: HistoryRecord, index: number): ComparisonGroup => ({
  id: record.id,
  taskId: record.taskId,
  name:
    index === 0
      ? '基线组'
      : index === 1
        ? '攻击组'
        : '防御组',
  status:
    record.status === 'completed'
      ? index === 0
        ? 'Optimal'
        : index === 1
          ? 'Observed'
          : 'Recovered'
      : record.status === 'failed'
        ? 'Failed'
        : 'Stopped',
  accent:
    record.status === 'failed'
      ? 'danger'
      : index === 0
        ? 'neutral'
        : index === 1
          ? 'danger'
          : 'tertiary',
  attackLabel: record.attackType,
  defenseLabel: record.defenseType,
  metrics: {
    recall10: record.metrics.recall10 ?? 0,
    recall20: record.metrics.recall20 ?? record.metrics.recall10 ?? 0,
    recall50: record.metrics.recall50 ?? record.metrics.recall10 ?? 0,
    ndcg10: record.metrics.ndcg10 ?? 0,
    ndcg20: record.metrics.ndcg20 ?? record.metrics.ndcg10 ?? 0,
    ndcg50: record.metrics.ndcg50 ?? record.metrics.ndcg10 ?? 0,
    loss: record.metrics.loss ?? 0,
  },
});

export const mockStore = {
  getDefaultComparison(): ComparisonResult {
    return structuredClone(mockComparisonData.defaultComparison);
  },
  getHistoryRecords() {
    return structuredClone(historyRecords);
  },
  getHistoryRecord(id: string) {
    const record = findHistoryRecord(id);
    return record ? structuredClone(record) : null;
  },
  deleteHistoryRecord(id: string) {
    historyRecords = historyRecords.filter((record) => record.id !== id);
  },
  saveTask(taskId: string, config: TrainConfig, snapshot: TaskStatusResponse) {
    taskConfigs.set(taskId, structuredClone(config));
    taskSnapshots.set(taskId, structuredClone(snapshot));
  },
  getTask(taskId: string) {
    const snapshot = taskSnapshots.get(taskId);
    return snapshot ? structuredClone(snapshot) : null;
  },
  getTaskConfig(taskId: string) {
    const config = taskConfigs.get(taskId);
    return config ? structuredClone(config) : null;
  },
  stopTask(taskId: string) {
    const current = taskSnapshots.get(taskId);
    const config = taskConfigs.get(taskId);
    if (!current || !config) {
      return null;
    }

    const next = createTaskStatusSnapshot(taskId, config, {
      status: 'stopped',
      currentRound: current.currentRound,
      progressPercent: current.progressPercent,
      currentStage: 'stopped',
      elapsedTime: current.elapsedTime,
      statusMessage: '任务已按用户请求停止，最后一次监控快照已保留。',
      logs: [
        ...current.logs,
        {
          id: `${taskId}-stop-log`,
          timestamp: '2026-03-25 16:40:00',
          level: 'warning',
          message: '收到停止指令，任务已安全退出。',
        },
      ],
    });

    taskSnapshots.set(taskId, structuredClone(next));
    return structuredClone(next);
  },
  getResult(taskId: string) {
    const result = taskResults.get(taskId);
    return result ? structuredClone(result) : null;
  },
  saveResult(taskId: string, config: TrainConfig, source: ExperimentResult['source']) {
    const result = createExperimentResult(taskId, config, source);
    taskResults.set(taskId, structuredClone(result));
    return structuredClone(result);
  },
  buildComparisonFromTaskIds(taskIds: string[]) {
    const records = taskIds
      .map((taskId) => historyRecords.find((record) => record.taskId === taskId))
      .filter((record): record is HistoryRecord => Boolean(record))
      .slice(0, 3);

    if (records.length < 2) {
      return this.getDefaultComparison();
    }

    const groups = records.map((record, index) => createComparisonGroupFromHistory(record, index));

    return {
      groups,
      summary: `已基于 ${records.length} 条历史实验记录生成对比结果，可用于进一步替换真实后端返回。`,
      findings: [
        '已从历史实验动态生成分组结果。',
        '当前对比逻辑仍为前端会话级 mock，可在接入真实 API 时替换。',
      ],
      metricComparison: groups.map((group) => ({
        name: group.name,
        recall: group.metrics.recall10,
        ndcg: group.metrics.ndcg10,
        loss: group.metrics.loss ?? 0,
      })),
      configDiff: [
        {
          label: '实验来源',
          baseline: records[0]?.name ?? '-',
          attack: records[1]?.name ?? '-',
          defense: records[2]?.name ?? '-',
        },
        {
          label: '攻击策略',
          baseline: records[0]?.attackType ?? '-',
          attack: records[1]?.attackType ?? '-',
          defense: records[2]?.attackType ?? '-',
        },
        {
          label: '防御机制',
          baseline: records[0]?.defenseType ?? '-',
          attack: records[1]?.defenseType ?? '-',
          defense: records[2]?.defenseType ?? '-',
        },
      ],
      stages: [
        {stage: '阶段 1：加载历史实验', status: 'Loaded', tone: 'primary'},
        {stage: '阶段 2：聚合指标', status: 'Compared', tone: 'tertiary'},
        {stage: '阶段 3：生成结论', status: 'Ready', tone: 'secondary'},
      ],
    } satisfies ComparisonResult;
  },
};
