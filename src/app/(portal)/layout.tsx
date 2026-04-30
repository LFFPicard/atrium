import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import PortalShell from '@/components/layout/PortalShell';
import { getAllModules } from '@/lib/modules';
import { getAllTabs } from '@/lib/tabs';
import type { TabRow } from '@/lib/tabs';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = {
    username: session.user.username,
    role: session.user.role,
  };

  const moduleRecords = getAllModules();
  const enabledModuleSlugs = moduleRecords
    .filter((m) => m.enabled)
    .map((m) => m.id);

  const allTabs = getAllTabs();
  const enabledTabs: TabRow[] = allTabs.filter((t) => t.enabled);

  return (
    <PortalShell user={user} enabledModuleSlugs={enabledModuleSlugs} tabs={enabledTabs}>
      {children}
    </PortalShell>
  );
}
