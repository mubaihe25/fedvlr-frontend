import {defaultTrainConfig} from '../mock/configuration';
import {createTaskStatusSnapshot} from '../mock/monitoring';
import {createMockId, simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';
import type {TaskLifecycleStatus} from '../types/task';
import type {TrainConfig} from '../types/train';

export interface StartTrainResponse {
  taskId: string;
  status: TaskLifecycleStatus;
  message: string;
}

export const startTrain = async (config: TrainConfig): Promise<StartTrainResponse> => {
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
      message: '训练任务已创建，可前往运行监控查看状态。',
    };
  });
};
