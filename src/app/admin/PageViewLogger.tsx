'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/csrf-client';

// Silently logs every admin page view to the activity log.
// Runs on the client so we have reliable access to the current pathname.
export function PageViewLogger() {
  const pathname = usePathname();
  const lastLogged = useRef('');

  useEffect(() => {
    // Skip login page and avoid double-logging the same path
    if (pathname === '/admin/login' || pathname === lastLogged.current) return;
    lastLogged.current = pathname;

    apiFetch('/api/admin/activity/log', {
      method: 'POST',
      body: JSON.stringify({ pathname }),
    }).catch(() => {/* non-fatal */});
  }, [pathname]);

  return null;
}
