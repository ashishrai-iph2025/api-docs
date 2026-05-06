import type { DocSection, NavGroup } from './types';
import { endpoints } from './endpoints';

export const sections: DocSection[] = [
  {
    id: 'introduction',
    number: '1',
    title: 'Introduction',
    customContent: 'introduction',
  },
  {
    id: 'login',
    number: '2',
    title: 'Login',
    customContent: 'login',
  },
  {
    id: 'authorization',
    number: '3',
    title: 'Authorization via Token',
    customContent: 'authorization',
  },
  {
    id: 'endpoints',
    number: '4',
    title: 'API Endpoints',
    customContent: 'platform-overview',
    endpoints,
  },
  {
    id: 'json-dataset',
    number: '5',
    title: 'JSON Response Dataset',
    customContent: 'json-dataset',
  },
  {
    id: 'summary',
    number: '6',
    title: 'Step by Step Summary',
    customContent: 'summary',
  },
  {
    id: 'support',
    number: '7',
    title: 'Support',
    customContent: 'support',
  },
];

export const navGroups: NavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', title: '1. Introduction' },
      { id: 'login', title: '2. Login' },
      { id: 'authorization', title: '3. Authorization' },
    ],
  },
  {
    title: 'API Endpoints',
    items: [
      { id: 'endpoints', title: '4. Overview' },
      ...endpoints.map((e, i) => ({
        id: `endpoints/${e.id}`,
        title: `4.${i + 1} ${e.title}`,
      })),
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'json-dataset', title: '5. JSON Response Dataset' },
      { id: 'summary', title: '6. Step by Step Summary' },
      { id: 'support', title: '7. Support' },
    ],
  },
];

export function findSection(id: string) {
  return sections.find((s) => s.id === id);
}

export function findEndpoint(id: string) {
  return endpoints.find((e) => e.id === id);
}
