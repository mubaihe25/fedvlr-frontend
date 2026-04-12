import {defaultTrainConfig} from '../mock/configuration';
import {createTaskStatusSnapshot} from '../mock/monitoring';
import {createMockId, simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';
import type {TaskLifecycleStatus} from '../types/task';
import type {LaunchExperimentOptions, LaunchExperimentResponse, TrainConfig} from '../types/train';
import {launchExperiment, type ExperimentConfigurationSource} from './experiment';

export interface StartTrainResponse {
  taskId: string;
  status: TaskLifecycleStatus;
  message: string;
  dataSource?: 'api' | 'mock';
  launchMode?: string;
  resultDir?: string | null;
  summaryPath?: string | null;
  resultPath?: string | null;
  csvPath?: string | null;
  validationWarnings?: string[];
  errors?: string[];
  launchResult?: LaunchExperimentResponse;
}

const startMockTrain = async (config: TrainConfig, fallbackReason?: string): Promise<StartTrainResponse> => {
  return simulateRequest(() => {
    const taskId = createMockId('task');
    const normalizedConfig = {
      ...defaultTrainConfig,
      ...config,
      advanced: {
        ...defaultTrainConfig.advanced,
        ...config.advanced,
      },
    };
    const snapshot = createTaskStatusSnapshot(taskId, normalizedConfig, {
      status: 'running',
      currentRound: 1,
      progressPercent: 1,
      elapsedTime: '00:00:12',
      statusMessage: '训练任务已创建，当前使用 mock 服务返回模拟中的运行状态。',
    });

    mockStore.saveTask(taskId, normalizedConfig, snapshot);

    return {
      taskId,
      status: 'running',
      dataSource: 'mock',
      message: fallbackReason
        ? `真实启动接口不可用，已回退 mock 任务：${fallbackReason}`
        : '训练任务已创建，可前往运行监控查看状态。',
    };
  });
};

export const startTrain = async (
  config: TrainConfig,
  options: LaunchExperimentOptions = {},
  source?: ExperimentConfigurationSource,
): Promise<StartTrainResponse> => {
  try {
    const response = await launchExperiment(config, source, options);
    const errors = response.errors ?? [];
    const warnings = response.validation_warnings ?? [];
    const taskId = response.launch_id ?? response.experiment_id ?? `launch-${Date.now()}`;
    const launchStatus = response.status;
    const status: TaskLifecycleStatus =
      response.accepted && (launchStatus === 'running' || launchStatus === 'queued')
        ? 'running'
        : response.success
          ? 'completed'
          : 'failed';

    return {
      taskId,
      status,
      dataSource: 'api',
      launchMode: response.launch_mode,
      resultDir: response.result_dir,
      summaryPath: response.summary_path,
      resultPath: response.result_path,
      csvPath: response.csv_path,
      validationWarnings: warnings,
      errors,
      launchResult: response,
      message: response.success
        ? [
            response.launch_mode === 'validate_only' || response.launch_mode === 'dry_run'
              ? '实验配置校验通过，未启动训练。'
              : response.status === 'running' || response.status === 'queued'
                ? '实验已提交后端 launcher，正在运行中。'
                : '实验已由真实后端完成并返回结果。',
            response.launch_id ? `Launch ID：${response.launch_id}` : null,
            response.experiment_id ? `实验 ID：${response.experiment_id}` : null,
            response.summary_path ? `摘要：${response.summary_path}` : null,
            warnings.length ? `提示：${warnings.join('；')}` : null,
          ]
            .filter(Boolean)
            .join(' ')
        : `实验启动失败：${errors.join('；') || response.stderr_tail || '请检查后端 launcher 输出。'}`,
    };
  } catch (error) {
    return startMockTrain(config, error instanceof Error ? error.message : 'API request failed');
  }
};
