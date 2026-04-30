import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { isModuleEnabled } from '@/lib/modules';
import { findTautulliUserId } from '@/lib/modules/tautulli';
import StatsClient from './StatsClient';

export const metadata = { title: 'Stats — Atrium' };

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  if (!isModuleEnabled('tautulli')) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-(--color-text)">Stats</h1>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Your media statistics.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-(--color-surface) border border-(--color-border) flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-(--color-text-muted)">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-(--color-text) mb-2">Tautulli not enabled</h2>
          <p className="text-sm text-(--color-text-muted) max-w-sm leading-relaxed">
            Enable the Tautulli module in the admin panel to see your media stats.
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = session.user.role === 'admin';

  let tautulliUserId: number | null = null;
  if (!isAdmin) {
    tautulliUserId = await findTautulliUserId(session.user.username);
  }

  const subtitle = isAdmin ? 'Server-wide overview for the last 30 days.' : 'Your personal activity for the last 30 days.';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-(--color-text)">Stats</h1>
        <p className="text-sm text-(--color-text-muted) mt-0.5">{subtitle}</p>
      </div>
      <StatsClient isAdmin={isAdmin} tautulliUserId={tautulliUserId} />
    </div>
  );
}
