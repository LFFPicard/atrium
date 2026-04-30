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
    <div className="-m-6 h-[calc(100vh-56px)] overflow-hidden">
      <MessagesClient
        userId={userId}
        userRole={session.user.role}
        username={session.user.username}
        allUsers={allUsers}
      />
    </div>
  );
}
