import fs from 'fs';
import path from 'path';
import { endpoints as staticEndpoints } from '@/data/endpoints';
import { sections as staticSections, navGroups as staticNavGroups } from '@/data/sections';
import type { Endpoint, NavGroup } from '@/data/types';

const FILE = path.join(process.cwd(), 'data', 'content.json');

export interface SupportContact {
  name: string;
  email: string;
}

export interface ContentData {
  endpoints?: Record<string, Partial<Endpoint>>;
  sectionTitles?: Record<string, string>;
  introduction?: {
    bannerText?: string;
    purpose?: string[];
    overview?: string[];
    whereToStart?: string;
  };
  login?: {
    description?: string;
    baseUrl?: string;
    loginPath?: string;
    tokenExample?: string;
    errorWrongUsername?: string;
    errorWrongPassword?: string;
  };
  support?: {
    description?: string;
    contacts?: SupportContact[];
    footerNote?: string;
  };
  authorization?: {
    description?: string;
    headerNote?: string;
    tokenExample?: string;
  };
}

function read(): ContentData {
  try {
    if (fs.existsSync(FILE)) {
      return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

export function writeContent(data: ContentData) {
  try {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('writeContent error:', error);
    throw error;
  }
}

export function getEndpoints(): Endpoint[] {
  const overrides = read().endpoints || {};
  const mergedStatic = staticEndpoints.map((ep) => {
    const ov = overrides[ep.id];
    if (!ov) return ep;
    return {
      ...ep,
      ...ov,
      parameters: ov.parameters ?? ep.parameters,
      responses: ov.responses ?? ep.responses,
      headers: ov.headers ?? ep.headers,
    };
  });

  const staticIds = new Set(staticEndpoints.map((ep) => ep.id));
  const customEndpoints = Object.entries(overrides)
    .filter(([id]) => !staticIds.has(id))
    .map(([id, endpoint]) => ({
      id,
      title: endpoint.title ?? id,
      method: endpoint.method ?? 'POST',
      path: endpoint.path ?? '/',
      description: endpoint.description ?? '',
      headers: endpoint.headers,
      requestBody: endpoint.requestBody,
      parameters: endpoint.parameters ?? [],
      responses: endpoint.responses ?? [{ status: 200, label: 'Success', body: '{}' }],
    }));

  return [...mergedStatic, ...customEndpoints];
}

export function getNavGroups(): NavGroup[] {
  const data = read();
  const titles = data.sectionTitles || {};
  const endpoints = getEndpoints();
  return [
    {
      title: 'Getting Started',
      items: [
        { id: 'introduction', title: `1. ${titles['introduction'] ?? 'Introduction'}` },
        { id: 'login', title: `2. ${titles['login'] ?? 'Login'}` },
        { id: 'authorization', title: `3. ${titles['authorization'] ?? 'Authorization'}` },
      ],
    },
    {
      title: 'API Endpoints',
      items: [
        { id: 'endpoints', title: `4. ${titles['endpoints'] ?? 'Overview'}` },
        ...endpoints.map((e, i) => ({
          id: `endpoints/${e.id}`,
          title: `4.${i + 1} ${e.title}`,
        })),
      ],
    },
    {
      title: 'Reference',
      items: [
        { id: 'json-dataset', title: `5. ${titles['json-dataset'] ?? 'JSON Response Dataset'}` },
        { id: 'summary', title: `6. ${titles['summary'] ?? 'Step by Step Summary'}` },
        { id: 'support', title: `7. ${titles['support'] ?? 'Support'}` },
      ],
    },
  ];
}

export function getSections() {
  const data = read();
  const titles = data.sectionTitles || {};
  return staticSections.map((s) => ({
    ...s,
    title: titles[s.id] ?? s.title,
  }));
}

export function getContentData(): ContentData {
  return read();
}
