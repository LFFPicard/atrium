import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getAllUsers } from '@/lib/users';
import UserTable from '@/components/admin/UserTable';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard');

  const users = getAllUsers();

  return <UserTable initialUsers={users} currentUserId={session.user.id!} />;
}
