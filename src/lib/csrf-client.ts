'use client';

/** Read the CSRF token that the server set as a readable cookie after login. */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Drop-in replacement for fetch() that automatically:
 * - Sends credentials (cookies) on every request
 * - Adds the X-CSRF-Token header on state-changing methods
 * - Defaults Content-Type to application/json when body is an object
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
    ...(needsCsrf ? { 'X-CSRF-Token': getCsrfToken() } : {}),
  };

  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers,
  });
}
