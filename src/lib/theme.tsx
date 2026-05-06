'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // On mount — read stored preference or system preference
  useEffect(() => {
    const stored = localStorage.getItem('ms-theme') as Theme | null;
    const system: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    apply(stored ?? system);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }

  const toggle = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('ms-theme', next);
    apply(next);
  }, [theme]);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}

/** Inline script injected into <head> to apply theme before first paint — prevents flash */
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('ms-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;
