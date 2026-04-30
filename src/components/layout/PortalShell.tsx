'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import type { TabRow } from '@/lib/tabs';

interface PortalShellProps {
  user: { username: string; role: string };
  enabledModuleSlugs: string[];
  tabs: TabRow[];
  children: React.ReactNode;
}

export default function PortalShell({ user, enabledModuleSlugs, tabs, children }: PortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-(--color-bg) overflow-hidden">
      <Sidebar
        user={user}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        enabledModuleSlugs={enabledModuleSlugs}
        tabs={tabs}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuToggle={() => setMobileOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
