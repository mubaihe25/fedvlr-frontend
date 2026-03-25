import { TaskStatus } from '../types/task';

export const getTaskStatus = async (taskId: string): Promise<TaskStatus> => {
  // TODO: Implement actual API call
  return {
    taskId,
    status: 'running',
    progress: 50,
  };
};

export const stopTask = async (taskId: string) => {
  // TODO: Implement actual API call
  console.log('Stopping task:', taskId);
  return { success: true };
};
