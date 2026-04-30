'use client';

import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendar',
  '/stats': 'Stats',
  '/wrapped': 'Wrapped',
  '/messages': 'Messages',
  '/requests': 'Requests',
  '/admin': 'Admin',
  '/admin/tabs': 'Tab Manager',
  '/admin/users': 'Users',
  '/admin/modules': 'Modules',
  '/admin/settings': 'Settings',
};

interface TopbarProps {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();

  const pageTitle = (() => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith('/tab/')) return 'Service';
    return 'Atrium';
  })();

  return (
    <header className="h-14 shrink-0 flex items-center gap-3 px-4 bg-(--color-navbar) border-b border-(--color-border)">
      <button
        onClick={onMenuToggle}
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-(--color-text-muted) hover:text-(--color-navbar-text) hover:bg-(--color-surface) transition-colors"
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <h1 className="text-sm font-semibold text-(--color-navbar-text)">{pageTitle}</h1>

      <div className="flex-1" />

      <span className="text-xs font-medium text-(--color-text-muted) tracking-wide select-none">Atrium</span>
    </header>
  );
}
