import Link from 'next/link';
import { Fragment } from 'react';
import { auth } from '@/lib/auth/config';
import NowPlayingWidget from '@/components/modules/NowPlayingWidget';
import RecentlyAddedWidget from '@/components/modules/RecentlyAddedWidget';
import UptimeWidget from '@/components/modules/UptimeWidget';
import QuickLinksWidget from '@/components/modules/QuickLinksWidget';
import DonationWidget from '@/components/modules/DonationWidget';
import CalendarWidget from '@/components/modules/CalendarWidget';
import StatsWidget from '@/components/modules/StatsWidget';
import WrappedWidget from '@/components/modules/WrappedWidget';
import OverseerrWidget from '@/components/modules/OverseerrWidget';
import LibraryStatsWidget from '@/components/modules/LibraryStatsWidget';
import MessagesWidget from '@/components/modules/MessagesWidget';
import { getDashboardWidgets } from '@/lib/dashboard';
import { FULL_WIDTH_WIDGETS } from '@/lib/widgetConfig';
import type { WidgetId } from '@/lib/widgetConfig';
import { getAllTabs } from '@/lib/tabs';
import { getSetting } from '@/lib/settings';
import type { TabRow } from '@/lib/tabs';

export const metadata = { title: 'Dashboard — Atrium' };

function EmptyDashboard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-(--color-surface) border border-(--color-border) flex items-center justify-center mb-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-(--color-text-muted)">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-(--color-text) mb-2">
        {isAdmin ? 'No modules enabled yet' : 'Nothing here yet'}
      </h2>
      <p className="text-sm text-(--color-text-muted) max-w-sm leading-relaxed mb-6">
        {isAdmin
          ? 'Connect Tautulli to see now playing and recently added, enable the Uptime Monitor to track your services, or add tabs to create quick links to your homelab apps.'
          : "Your admin hasn't enabled any modules yet. Check back soon."}
      </p>
      {isAdmin && (
        <Link
          href="/admin/modules"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-(--color-button) text-(--color-button-text) text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Go to Modules
        </Link>
      )}
    </div>
  );
}

function renderWidget(
  id: WidgetId,
  opts: { isAdmin: boolean; username: string; visibleTabs: TabRow[] },
): React.ReactNode {
  const { isAdmin, username, visibleTabs } = opts;
  switch (id) {
    case 'now-playing':    return <NowPlayingWidget />;
    case 'recently-added': return <RecentlyAddedWidget />;
    case 'stats':          return <StatsWidget isAdmin={isAdmin} />;
    case 'library-stats':  return <LibraryStatsWidget />;
    case 'wrapped':        return <WrappedWidget />;
    case 'messages':       return <MessagesWidget />;
    case 'overseerr':      return <OverseerrWidget isAdmin={isAdmin} username={username} />;
    case 'calendar':       return <CalendarWidget />;
    case 'uptime':         return <UptimeWidget isAdmin={isAdmin} />;
    case 'quick-links':    return visibleTabs.length > 0 ? <QuickLinksWidget tabs={visibleTabs} /> : null;
    default:               return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const username = session?.user?.username ?? 'there';
  const userRole = session?.user?.role ?? 'user';
  const isAdmin = userRole === 'admin';

  const activeWidgets = getDashboardWidgets(userRole);

  // 'messages' manages its own visibility client-side — exclude it from the module-based empty check
  const isEmpty = activeWidgets.filter((id) => id !== 'messages').length === 0;

  const allTabs = getAllTabs();
  const visibleTabs: TabRow[] = allTabs.filter(
    (t) => t.enabled && (isAdmin || t.minRole === 'user'),
  );

  const donationEnabled = getSetting<boolean>('donation_enabled') ?? false;
  const donationPlacement = getSetting<string>('donation_placement') ?? 'sidebar';
  const donationUrl = getSetting<string>('donation_url') ?? '';
  const donationLabel = getSetting<string>('donation_label') ?? 'Support this server';
  const showDonationWidget = donationEnabled && !!donationUrl && donationPlacement === 'dashboard';

  const opts = { isAdmin, username, visibleTabs };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-(--color-text)">
          Welcome back, {username}
        </h1>
        <p className="text-sm text-(--color-text-muted) mt-0.5">Your homelab at a glance.</p>
      </div>

      {isEmpty ? (
        <>
          {/* Still show messages widget even when no modules are active */}
          {activeWidgets.includes('messages') && (
            <div className="mb-6">
              <MessagesWidget />
            </div>
          )}
          <EmptyDashboard isAdmin={isAdmin} />
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeWidgets.map((id) => {
            const el = renderWidget(id, opts);
            if (!el) return null;
            return FULL_WIDTH_WIDGETS.has(id) ? (
              <div key={id} className="md:col-span-2">{el}</div>
            ) : (
              <Fragment key={id}>{el}</Fragment>
            );
          })}

          {/* Donation widget — placement-controlled, always at the end */}
          {showDonationWidget && (
            <DonationWidget url={donationUrl} label={donationLabel} />
          )}
        </div>
      )}
    </div>
  );
}
