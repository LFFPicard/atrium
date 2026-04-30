import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { isModuleEnabled } from '@/lib/modules';
import RequestsClient from './RequestsClient';

export const metadata = { title: 'Requests — Atrium' };

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  if (!isModuleEnabled('overseerr')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-(--color-text-muted) mb-4">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeWidth={2} />
        </svg>
        <p className="text-(--color-text) font-semibold mb-1">Requests unavailable</p>
        <p className="text-sm text-(--color-text-muted)">The Overseerr module is not enabled.</p>
      </div>
    );
  }

  const isAdmin = session.user.role === 'admin';
  const username = session.user.username;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-(--color-text)">Requests</h1>
        <p className="text-sm text-(--color-text-muted) mt-0.5">
          {isAdmin ? 'Manage media requests from all users.' : 'Track your media requests.'}
        </p>
      </div>
      <RequestsClient isAdmin={isAdmin} username={username} />
    </div>
  );
}
