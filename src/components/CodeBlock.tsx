'use client';

import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-http';
import { Check, Copy } from 'lucide-react';
import clsx from 'clsx';

interface CodeBlockProps {
  code: string;
  language?: 'json' | 'bash' | 'http' | 'plain';
  title?: string;
  /** Render flush inside a surrounding panel (no own margin, border or radius). */
  embedded?: boolean;
}

export function CodeBlock({ code, language = 'json', title, embedded = false }: CodeBlockProps) {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ref.current) Prism.highlightElement(ref.current);
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard not allowed */ }
  };

  return (
    <div
      className={clsx(
        'overflow-hidden bg-[var(--color-code-bg)]',
        !embedded && 'my-4 rounded-md border border-[var(--color-border)]'
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2">
          <span className="text-[12px] font-medium text-[var(--color-fg-muted)]">{title}</span>
        </div>
      )}
      <div className="relative group">
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-[11px] text-[var(--color-fg-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)] transition-all"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[var(--color-success)]" />
              <span style={{ color: 'var(--color-success)' }}>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
        <pre className={`language-${language}`}>
          <code ref={ref} className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
