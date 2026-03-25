import { HistoryRecord } from '../types/history';

export const getHistoryList = async (): Promise<HistoryRecord[]> => {
  // TODO: Implement actual API call
  return [];
};

export const deleteHistory = async (id: string) => {
  // TODO: Implement actual API call
  console.log('Deleting history:', id);
  return { success: true };
};

export const reuseHistoryConfig = async (id: string) => {
  // TODO: Implement actual API call
  console.log('Reusing history config:', id);
  return { success: true };
};
