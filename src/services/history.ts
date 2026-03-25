import {simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';
import type {HistoryListResponse, ReuseHistoryResponse} from '../types/history';

export const getHistoryList = async (): Promise<HistoryListResponse> => {
  return simulateRequest(() => {
    const records = mockStore.getHistoryRecords();
    return {
      records,
      total: records.length,
    };
  });
};

export const deleteHistory = async (id: string): Promise<{success: boolean; id: string}> => {
  return simulateRequest(() => {
    mockStore.deleteHistoryRecord(id);
    return {success: true, id};
  });
};

export const reuseHistoryConfig = async (id: string): Promise<ReuseHistoryResponse> => {
  return simulateRequest(() => {
    const record = mockStore.getHistoryRecord(id);
    if (!record) {
      throw new Error(`未找到历史实验 ${id}`);
    }

    return {
      success: true,
      id,
      taskId: record.taskId,
      config: record.config,
      message: `已复用 ${record.name} 的实验配置。`,
    };
  });
};
