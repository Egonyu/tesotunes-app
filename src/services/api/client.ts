import { getRuntimePlatform } from '../platform/runtime-platform';
import { Platform } from 'react-native';

export function getApiBaseUrl() {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is not set. Add it to your .env file before running the app.'
    );
  }
  return url.replace(/\/+$/, '');
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ApiErrorPayload = {
  message?: string;
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = 'ApiError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

async function buildApiError(response: Response) {
  const fallbackMessage = `API request failed with status ${response.status}`;

  try {
    const payload = (await response.json()) as ApiErrorPayload;

    if (payload.errors) {
      const firstError = Object.values(payload.errors).flat()[0];

      if (firstError) {
        return new ApiError(firstError, { code: payload.code, status: response.status });
      }
    }

    if (payload.message) {
      return new ApiError(payload.message, { code: payload.code, status: response.status });
    }

    if (payload.error) {
      return new ApiError(payload.error, { code: payload.code, status: response.status });
    }
  } catch {
    // Fall through to status-based error when the server does not return JSON.
  }

  return new ApiError(fallbackMessage, { status: response.status });
}

type UnauthorizedHandler = () => void;
type RefreshHandler = () => Promise<string | null>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshHandler: RefreshHandler | null = null;

export function setOnUnauthorized(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

export function setOnRefreshToken(handler: RefreshHandler): void {
  refreshHandler = handler;
}

async function request<T>(method: HttpMethod, path: string, token?: string, body?: unknown, isRetry = false): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(Platform.OS === 'web' ? {} : { 'x-expo-platform': getRuntimePlatform() }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Network request failed for ${method} ${url}: ${message}`);
  }

  if (response.status === 401) {
    if (!isRetry && token && refreshHandler) {
      const newToken = await refreshHandler();
      if (newToken) {
        return request<T>(method, path, newToken, body, true);
      }
    }
    unauthorizedHandler?.();
    throw new ApiError('Session expired. Please sign in again.', { status: 401, code: 'UNAUTHORIZED' });
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return request<T>('GET', path, token);
}

export async function apiPost<T, B = unknown>(path: string, body?: B, token?: string): Promise<T> {
  return request<T>('POST', path, token, body);
}

export async function apiPut<T, B = unknown>(path: string, body?: B, token?: string): Promise<T> {
  return request<T>('PUT', path, token, body);
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  return request<T>('DELETE', path, token);
}

export async function apiPostFormData<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(Platform.OS === 'web' ? {} : { 'x-expo-platform': getRuntimePlatform() }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Network request failed for POST ${url}: ${message}`);
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return response.json() as Promise<T>;
}
