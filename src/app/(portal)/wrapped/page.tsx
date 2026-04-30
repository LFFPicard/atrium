import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { isModuleEnabled } from '@/lib/modules';
import { findTautulliUserId } from '@/lib/modules/tautulli';
import { getWrappedData } from '@/lib/wrapped';
import WrappedClient from './WrappedClient';

export const metadata = { title: 'Wrapped — Atrium' };

export default async function WrappedPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  if (!isModuleEnabled('tautulli')) {
    return <WrappedClient data={null} selectedYear={new Date().getFullYear()} availableYears={[]} noTautulli />;
  }

  const currentYear = new Date().getFullYear();
  const { year: yearParam } = await searchParams;
  const requestedYear = yearParam ? parseInt(yearParam, 10) : currentYear;
  const selectedYear =
    isNaN(requestedYear) || requestedYear < 2010 || requestedYear > currentYear
      ? currentYear
      : requestedYear;

  const availableYears: number[] = [];
  for (let y = currentYear; y >= Math.max(currentYear - 4, 2010); y--) {
    availableYears.push(y);
  }

  const isAdmin = session.user.role === 'admin';
  let tautulliUserId: number | null = null;
  if (!isAdmin) {
    tautulliUserId = await findTautulliUserId(session.user.username);
  }

  const data = await getWrappedData(userId, selectedYear, tautulliUserId);

  return (
    <WrappedClient
      data={data}
      selectedYear={selectedYear}
      availableYears={availableYears}
    />
  );
}
