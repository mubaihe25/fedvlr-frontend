export const mockDelay = (duration = 240) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

export const cloneValue = <T>(value: T): T => structuredClone(value);

export const simulateRequest = async <T>(factory: () => T, duration = 240): Promise<T> => {
  await mockDelay(duration);
  return cloneValue(factory());
};

export const createMockId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
