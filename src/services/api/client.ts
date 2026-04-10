const FALLBACK_API_BASE_URL = 'http://127.0.0.1:8000/api';

export function getApiBaseUrl() {
  return (process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL).replace(/\/+$/, '');
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ApiErrorPayload = {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

async function buildApiError(response: Response) {
  const fallbackMessage = `API request failed with status ${response.status}`;

  try {
    const payload = (await response.json()) as ApiErrorPayload;

    if (payload.errors) {
      const firstError = Object.values(payload.errors).flat()[0];

      if (firstError) {
        return new Error(firstError);
      }
    }

    if (payload.message) {
      return new Error(payload.message);
    }

    if (payload.error) {
      return new Error(payload.error);
    }
  } catch {
    // Fall through to status-based error when the server does not return JSON.
  }

  return new Error(fallbackMessage);
}

async function request<T>(method: HttpMethod, path: string, token?: string, body?: unknown): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Network request failed for ${method} ${url}: ${message}`);
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
