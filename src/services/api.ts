const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';
const DEV_PROXY_BASE_URL = '/api';
const LOCAL_API_HOSTS = new Set(['127.0.0.1', 'localhost']);

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const shouldUseDevProxy = (configuredBaseUrl?: string) => {
  if (!import.meta.env.DEV) {
    return false;
  }

  if (!configuredBaseUrl) {
    return true;
  }

  try {
    const parsed = new URL(configuredBaseUrl);
    return LOCAL_API_HOSTS.has(parsed.hostname);
  } catch {
    return configuredBaseUrl.startsWith(DEV_PROXY_BASE_URL);
  }
};

export const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (shouldUseDevProxy(configuredBaseUrl)) {
    return DEV_PROXY_BASE_URL;
  }

  return trimTrailingSlash(configuredBaseUrl || DEFAULT_API_BASE_URL);
};

export const apiGet = async <T>(path: string): Promise<T> => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
};
