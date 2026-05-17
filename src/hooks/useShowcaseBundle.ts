import {useEffect, useState} from 'react';
import {fallbackToMockShowcase, loadShowcaseBundle} from '../services/showcase';
import type {ShowcaseBundle} from '../types/showcase';

export const useShowcaseBundle = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>();
  const [bundle, setBundle] = useState<ShowcaseBundle>(() => fallbackToMockShowcase());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    loadShowcaseBundle(selectedScenarioId)
      .then((nextBundle) => {
        if (isActive) {
          setBundle(nextBundle);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setBundle(fallbackToMockShowcase(selectedScenarioId, error instanceof Error ? error.message : String(error)));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedScenarioId]);

  return {
    bundle,
    isLoading,
    selectedScenarioId: bundle.selectedScenario.scenarioId,
    setSelectedScenarioId,
  };
};
