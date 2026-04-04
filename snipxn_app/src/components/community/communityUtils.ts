import { API_BASE_URL } from '../../api';

import { translateLiteral } from '../../i18n';

interface RuntimeProcess {
  env?: Record<string, string | undefined>;
}

export function resolveCommunityAssetUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${apiOrigin}${value.startsWith('/') ? '' : '/'}${value}`;
}

export function getUserAvatarFallback(name: string | null | undefined): string {
  const source = name?.trim() || 'S';
  return source.slice(0, 1).toUpperCase();
}

export function getCommunityErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return translateLiteral(error.message);
  }

  return fallback;
}

function getRuntimeEnv(): Record<string, string | undefined> {
  const runtime = globalThis as typeof globalThis & { process?: RuntimeProcess };
  return runtime.process?.env ?? {};
}

function resolveWebBaseUrl(): string {
  const env = getRuntimeEnv();
  const configuredBaseUrl =
    env.SNIPXN_WEB_BASE_URL ?? env.WEB_BASE_URL ?? env.REACT_NATIVE_WEB_BASE_URL;

  if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
}

export function buildCommunityShareUrl(shareToken: string): string {
  return `${resolveWebBaseUrl()}/share/${shareToken}`;
}
