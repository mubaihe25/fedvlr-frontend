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

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as {detail?: unknown; error_message?: unknown; message?: unknown};
    const detail = payload.error_message ?? payload.detail ?? payload.message;
    if (Array.isArray(detail)) return detail.map((item) => String(item?.msg ?? item)).join('；');
    if (detail) return String(detail);
  } catch {
    // Fall through to the HTTP status text below.
  }
  return `API request failed: ${response.status} ${response.statusText}`;
};

const requestFailedMessage = (error: unknown) => {
  if (error instanceof TypeError) {
    return '后端服务未连接，请确认 FedVLR-API 已启动并且前端代理指向 /api。';
  }
  return error instanceof Error ? error.message : String(error);
};

export const apiGet = async <T>(path: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (error) {
    throw new Error(requestFailedMessage(error));
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
};

export const apiPost = async <T>(path: string, body: unknown): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(requestFailedMessage(error));
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
};
