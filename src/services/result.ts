import { TaskResult } from '../types/result';

export const getResult = async (taskId: string): Promise<TaskResult> => {
  // TODO: Implement actual API call
  return {
    taskId,
    accuracy: 0.95,
    loss: 0.05,
    metrics: {},
  };
};
