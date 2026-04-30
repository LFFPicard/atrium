import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { isModuleEnabled } from '@/lib/modules';
import { getUserSubscriptions } from '@/lib/subscriptions';
import CalendarClient from './CalendarClient';

export const metadata = { title: 'Calendar — Atrium' };

export default async function CalendarPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const sonarrEnabled = isModuleEnabled('sonarr');
  const radarrEnabled = isModuleEnabled('radarr');

  if (!sonarrEnabled && !radarrEnabled) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-(--color-text)">Calendar</h1>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Your upcoming episodes and movies.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-(--color-surface) border border-(--color-border) flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-(--color-text-muted)">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-(--color-text) mb-2">No calendar modules enabled</h2>
          <p className="text-sm text-(--color-text-muted) max-w-sm leading-relaxed">
            Enable Sonarr or Radarr in the admin modules panel to see your upcoming episodes and movies.
          </p>
        </div>
      </div>
    );
  }

  const subs = getUserSubscriptions(userId);
  const initialSubscriptions = subs.map((s) => ({
    mediaType: s.mediaType,
    sonarrId: s.sonarrId,
    radarrId: s.radarrId,
    title: s.title,
    posterUrl: s.posterUrl,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-(--color-text)">Calendar</h1>
        <p className="text-sm text-(--color-text-muted) mt-0.5">Your upcoming episodes and movies.</p>
      </div>
      <CalendarClient
        initialSubscriptions={initialSubscriptions}
        sonarrEnabled={sonarrEnabled}
        radarrEnabled={radarrEnabled}
      />
    </div>
  );
}
