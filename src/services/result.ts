import {mockAnalysisData} from '../mock/analysis';
import {simulateRequest} from './mockAdapter';
import {mockStore} from './mockStore';
import type {ComparisonResult, ExperimentResult} from '../types/result';

export const getResult = async (taskId: string): Promise<ExperimentResult | null> => {
  return simulateRequest(() => {
    if (!taskId) {
      return null;
    }

    return mockStore.getResult(taskId);
  });
};

export const getComparisonResult = async (taskIds?: string[]): Promise<ComparisonResult> => {
  return simulateRequest(() => {
    if (!taskIds || taskIds.length < 2) {
      return mockStore.getDefaultComparison();
    }

    return mockStore.buildComparisonFromTaskIds(taskIds);
  });
};

export const getHistoryFallbackResult = async (): Promise<ExperimentResult> => {
  return simulateRequest(() => mockAnalysisData.historyFallback);
};
