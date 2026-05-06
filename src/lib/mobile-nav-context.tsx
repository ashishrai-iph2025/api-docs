'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { NavGroup } from '@/data/types';

interface MobileNavCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  navGroups: NavGroup[];
  setNavGroups: (groups: NavGroup[]) => void;
}

const Ctx = createContext<MobileNavCtx>({
  open: false,
  setOpen: () => {},
  navGroups: [],
  setNavGroups: () => {},
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [navGroups, setNavGroups] = useState<NavGroup[]>([]);
  const setNavGroupsCb = useCallback((g: NavGroup[]) => setNavGroups(g), []);
  return (
    <Ctx.Provider value={{ open, setOpen, navGroups, setNavGroups: setNavGroupsCb }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMobileNav() {
  return useContext(Ctx);
}
