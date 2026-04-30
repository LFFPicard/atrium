'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DonationWidget from '@/components/modules/DonationWidget';
import type { TabRow } from '@/lib/tabs';

interface DonationConfig {
  enabled: boolean;
  placement: string;
  url: string;
  label: string;
}

interface PortalShellProps {
  user: { username: string; role: string };
  enabledModuleSlugs: string[];
  tabs: TabRow[];
  donation: DonationConfig;
  children: React.ReactNode;
}

export default function PortalShell({ user, enabledModuleSlugs, tabs, donation, children }: PortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  // Full-panel pages (iFrame tabs, messages) manage their own height — footer would cause overflow
  const showFooter = !pathname.startsWith('/tab/') && pathname !== '/messages';

  const showDonation = donation.enabled && !!donation.url;
  const footerDonation = showDonation && donation.placement === 'footer';

  return (
    <div className="flex h-screen bg-(--color-bg) overflow-hidden">
      <Sidebar
        user={user}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        enabledModuleSlugs={enabledModuleSlugs}
        tabs={tabs}
        donation={showDonation && donation.placement === 'sidebar' ? donation : null}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuToggle={() => setMobileOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        {showFooter && (
          <footer className="shrink-0 border-t border-(--color-border) px-6 py-2 flex items-center justify-between gap-4">
            {footerDonation ? (
              <DonationWidget url={donation.url} label={donation.label} compact />
            ) : (
              <span className="text-xs text-(--color-text-muted)">Atrium v0.1.0 · © 2025</span>
            )}
            <div className="flex items-center gap-3">
              {footerDonation && (
                <span className="text-xs text-(--color-text-muted)">Atrium v0.1.0</span>
              )}
              <a
                href="https://github.com/LFFPicard/atrium"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-(--color-text-muted) hover:text-(--color-text) transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/LFFPicard/atrium/wiki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-(--color-text-muted) hover:text-(--color-text) transition-colors"
              >
                Docs
              </a>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
