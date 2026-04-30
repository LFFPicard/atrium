import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import PortalShell from '@/components/layout/PortalShell';
import { getAllModules } from '@/lib/modules';
import { getAllTabs } from '@/lib/tabs';
import { getSettings } from '@/lib/settings';
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

  const raw = getSettings(['donation_enabled', 'donation_placement', 'donation_url', 'donation_label']);
  const donation = {
    enabled: (raw.donation_enabled as boolean) ?? false,
    placement: (raw.donation_placement as string) ?? 'sidebar',
    url: (raw.donation_url as string) ?? '',
    label: (raw.donation_label as string) ?? '',
  };

  return (
    <PortalShell user={user} enabledModuleSlugs={enabledModuleSlugs} tabs={enabledTabs} donation={donation}>
      {children}
    </PortalShell>
  );
}
