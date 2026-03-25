export interface TaskResult {
  taskId: string;
  accuracy: number;
  loss: number;
  metrics: Record<string, number>;
}
