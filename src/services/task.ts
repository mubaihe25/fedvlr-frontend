import {simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';
import type {StopTaskResponse, TaskStatusResponse} from '../types/task';

export const getTaskStatus = async (taskId: string): Promise<TaskStatusResponse> => {
  return simulateRequest(() => {
    const task = mockStore.getTask(taskId);
    if (!task) {
      throw new Error(`未找到任务 ${taskId}`);
    }

    return task;
  });
};

export const stopTask = async (taskId: string): Promise<StopTaskResponse> => {
  return simulateRequest(() => {
    const task = mockStore.stopTask(taskId);
    if (!task) {
      throw new Error(`未找到可停止的任务 ${taskId}`);
    }

    return {
      success: true,
      taskId,
      status: task.status,
      message: '任务已停止，监控数据保持为最后一次快照。',
    };
  });
};
