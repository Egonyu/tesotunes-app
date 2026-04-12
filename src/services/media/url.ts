import { getApiBaseUrl } from '../api/client';

function getApiOrigin() {
  const baseUrl = getApiBaseUrl();

  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
}

function isLocalOnlyHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.endsWith('.test');
}

export function resolveMediaUrl(input?: string | null) {
  if (!input) {
    return undefined;
  }

  const apiOrigin = getApiOrigin();

  if (/^https?:\/\//i.test(input)) {
    try {
      const parsed = new URL(input);

      if (apiOrigin && isLocalOnlyHost(parsed.hostname)) {
        const fallbackOrigin = new URL(apiOrigin);
        parsed.protocol = fallbackOrigin.protocol;
        parsed.host = fallbackOrigin.host;
      }

      return parsed.toString();
    } catch {
      return input;
    }
  }

  if (!apiOrigin) {
    return input;
  }

  return `${apiOrigin}${input.startsWith('/') ? input : `/${input}`}`;
}
