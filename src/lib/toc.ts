import type { TocItem } from '@/components/OnThisPage';
import type { Endpoint } from '@/data/types';

export function tocForCustomContent(
  type: string | undefined,
  title: string
): TocItem[] {
  const top: TocItem = { id: 'top', title };

  switch (type) {
    case 'introduction':
      return [
        top,
        { id: 'purpose', title: 'Purpose' },
        { id: 'overview', title: 'Platform Overview' },
        { id: 'where-to-start', title: 'Where to Start' },
      ];
    case 'login':
      return [
        top,
        { id: 'base-url', title: 'Base URL' },
        { id: 'login-request', title: 'Login Request' },
        { id: 'login-headers', title: 'Headers', level: 3 },
        { id: 'login-body', title: 'Request Body', level: 3 },
        { id: 'login-params', title: 'Parameters', level: 3 },
        { id: 'login-responses', title: 'Responses' },
      ];
    case 'authorization':
      return [
        top,
        { id: 'auth-overview', title: 'Authorization Overview' },
        { id: 'auth-header', title: 'Authorization Header' },
      ];
    case 'platform-overview':
      return [
        top,
        { id: 'all-platforms', title: '4.1 All Platforms' },
        { id: 'platform-endpoints', title: '4.2 Platform Endpoints' },
        { id: 'pagination', title: 'Pagination' },
        { id: 'common-format', title: 'Common Request Format' },
      ];
    case 'json-dataset':
      return [top];
    case 'summary':
      return [
        top,
        { id: 'step-1', title: 'Step 1 — Authentication' },
        { id: 'step-2', title: 'Step 2 — Authorization' },
        { id: 'step-3', title: 'Step 3 — Fetch Data' },
        { id: 'step-4', title: 'Step 4 — Parameters' },
        { id: 'step-5', title: 'Step 5 — Response' },
      ];
    case 'support':
      return [top];
    default:
      return [top];
  }
}

export function tocForEndpoint(endpoint: Endpoint): TocItem[] {
  const items: TocItem[] = [{ id: 'top', title: endpoint.title }];
  if (endpoint.description) items.push({ id: 'description', title: 'Description' });
  if (endpoint.headers) items.push({ id: 'headers', title: 'Headers' });
  if (endpoint.requestBody) items.push({ id: 'request-body', title: 'Request Body' });
  if (endpoint.parameters?.length) items.push({ id: 'parameters', title: 'Parameters' });
  items.push({ id: 'responses', title: 'Responses' });
  return items;
}
