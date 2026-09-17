'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { CodeBlock } from './CodeBlock';
import type { Parameter } from '@/data/types';

/** Doc type names rendered in Swagger's `type($format)` notation. */
const SWAGGER_TYPES: Record<string, string> = {
  datetime: 'string($date-time)',
  date: 'string($date)',
  timestamp: 'string($date-time)',
  int: 'integer',
  int32: 'integer($int32)',
  int64: 'integer($int64)',
  float: 'number($float)',
  double: 'number($double)',
  bool: 'boolean',
};

function swaggerType(type: string): string {
  return SWAGGER_TYPES[type.trim().toLowerCase()] ?? type;
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        '-mb-px border-b-2 py-2 text-[12px] transition-colors',
        active
          ? 'border-[var(--color-brand)] font-semibold text-[var(--color-fg)]'
          : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
      )}
    >
      {label}
    </button>
  );
}

/**
 * Swagger-style body panel: an "Example Value" tab with the JSON sample and a
 * "Schema" tab listing each field's JSON type. The Schema tab only appears when
 * field metadata is available.
 */
export function BodySchemaPanel({
  example,
  fields,
  language = 'json',
}: {
  example: string;
  fields?: Parameter[];
  language?: 'json' | 'http' | 'plain';
}) {
  const [tab, setTab] = useState<'example' | 'schema'>('example');
  const hasSchema = Boolean(fields && fields.length > 0);
  const active = hasSchema ? tab : 'example';

  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
      <div className="flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <Tab
          label="Example Value"
          active={active === 'example'}
          onClick={() => setTab('example')}
        />
        {hasSchema && (
          <Tab label="Schema" active={active === 'schema'} onClick={() => setTab('schema')} />
        )}
      </div>

      {active === 'example' ? (
        <CodeBlock code={example} language={language} embedded />
      ) : (
        <div className="overflow-x-auto bg-[var(--color-code-bg)] px-5 py-4 font-mono text-[13px] leading-[1.6]">
          <div className="text-[var(--color-fg)]">{'{'}</div>
          <ul className="my-1 ml-5 space-y-2.5">
            {fields!.map((f) => (
              <li key={f.name}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-[var(--color-fg)]">
                    {f.name}
                    {f.required && (
                      <span className="text-[var(--color-error)]" title="required">
                        *
                      </span>
                    )}
                  </span>
                  <span className="text-[var(--color-fg-muted)]">{swaggerType(f.type)}</span>
                </div>
                {f.description && (
                  <p className="mt-0.5 font-sans text-[12.5px] leading-snug text-[var(--color-fg-muted)]">
                    {f.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="text-[var(--color-fg)]">{'}'}</div>
        </div>
      )}
    </div>
  );
}
