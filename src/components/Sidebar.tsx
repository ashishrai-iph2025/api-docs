import { getNavGroups } from '@/lib/content-store';
import { SidebarClient } from './SidebarClient';

export function Sidebar() {
  const navGroups = getNavGroups();
  return <SidebarClient navGroups={navGroups} />;
}
