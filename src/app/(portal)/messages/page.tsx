import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getAllUsers } from '@/lib/users';
import MessagesClient from './MessagesClient';

export const metadata = { title: 'Messages — Atrium' };

export default async function MessagesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const isAdmin = session.user.role === 'admin';

  const allUsers = isAdmin
    ? getAllUsers()
        .filter((u) => u.id !== userId)
        .map((u) => ({ id: u.id, username: u.username }))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-(--color-text)">Messages</h1>
        <p className="text-sm text-(--color-text-muted) mt-0.5">
          {isAdmin ? 'All messages across Atrium.' : 'Send a message to your admin.'}
        </p>
      </div>
      <MessagesClient
        userId={userId}
        userRole={session.user.role}
        username={session.user.username}
        allUsers={allUsers}
      />
    </div>
  );
}
