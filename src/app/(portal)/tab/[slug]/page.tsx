import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getTabBySlug } from '@/lib/tabs';

export default async function TabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const tab = getTabBySlug(slug);

  if (!tab || !tab.enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-(--color-text-muted) mb-4">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeWidth={2} />
        </svg>
        <p className="text-(--color-text) font-semibold mb-1">Tab not found</p>
        <p className="text-sm text-(--color-text-muted)">This service doesn&apos;t exist or has been disabled.</p>
      </div>
    );
  }

  if (tab.minRole === 'admin' && session.user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-(--color-text-muted) mb-4">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <p className="text-(--color-text) font-semibold mb-1">Access denied</p>
        <p className="text-sm text-(--color-text-muted)">This service is restricted to admins.</p>
      </div>
    );
  }

  if (!tab.openInIframe) {
    redirect(tab.url);
  }

  return (
    <div className="-m-6 h-[calc(100vh-56px)]">
      <iframe
        src={tab.url}
        className="w-full h-full border-0"
        title={tab.label}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
      />
    </div>
  );
}
