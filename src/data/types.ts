export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ResponseField {
  name: string;
  description: string;
}

export interface ResponseExample {
  status: number;
  label: string;
  body: string; // JSON string or plain text
}

export interface Endpoint {
  id: string;          // url-slug, e.g. "youtube"
  title: string;       // "YouTube Response"
  method: HttpMethod;
  path: string;        // "/getinfringements/YouTube"
  description: string;
  active?: boolean;    // false = hidden from public docs (default true)
  headers?: Record<string, string>;
  requestBody?: string; // JSON example
  parameters?: Parameter[];
  responses: ResponseExample[];
  responseFields?: ResponseField[];
}

export interface DocSection {
  id: string;          // url-slug
  number: string;      // "1", "4.1"
  title: string;       // "Introduction"
  intro?: string;      // markdown-lite text
  endpoints?: Endpoint[];
  customContent?: 'introduction' | 'login' | 'authorization' | 'platform-overview' | 'json-dataset' | 'summary' | 'support';
}

export interface NavGroup {
  title: string;
  items: { id: string; title: string }[];
}
