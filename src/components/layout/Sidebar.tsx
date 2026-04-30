'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import DonationWidget from '@/components/modules/DonationWidget';
import type { TabRow } from '@/lib/tabs';

interface SidebarProps {
  user: { username: string; role: string };
  mobileOpen: boolean;
  onMobileClose: () => void;
  enabledModuleSlugs: string[];
  tabs: TabRow[];
  donation: { url: string; label: string } | null;
}

const navItems = [
  {
    href: '/dashboard', label: 'Dashboard',
    requiredModules: [] as string[],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/calendar', label: 'Calendar',
    requiredModules: ['sonarr', 'radarr'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth={2} />
      </svg>
    ),
  },
  {
    href: '/stats', label: 'Stats',
    requiredModules: ['tautulli'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M3 21h18M3 21V9l6-6 6 6v12M9 21V13h6v8" />
      </svg>
    ),
  },
  {
    href: '/wrapped', label: 'Wrapped',
    requiredModules: ['tautulli'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 9h6.1L12 3z" />
      </svg>
    ),
  },
  {
    href: '/messages', label: 'Messages',
    requiredModules: [] as string[],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: '/requests', label: 'Requests',
    requiredModules: ['overseerr'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M20 12V22H4V12" />
        <path d="M22 7H2v5h20V7z" />
        <path d="M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
];

const adminItems = [
  {
    href: '/admin', label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
      </svg>
    ),
  },
  {
    href: '/admin/tabs', label: 'Tab Manager',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M2 9h20M9 21V9" />
      </svg>
    ),
  },
  {
    href: '/admin/users', label: 'Users',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" />
      </svg>
    ),
  },
  {
    href: '/admin/modules', label: 'Modules',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: '/admin/uptime', label: 'Uptime',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/admin/settings', label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

const avatarColors = [
  'bg-blue-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-orange-600', 'bg-pink-600', 'bg-cyan-600',
];

function UserAvatar({ username }: { username: string }) {
  const color = avatarColors[username.charCodeAt(0) % avatarColors.length];
  return (
    <div className={`w-8 h-8 text-sm ${color} rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none`}>
      {username[0].toUpperCase()}
    </div>
  );
}

function TabIcon({ icon, collapsed }: { icon: string; collapsed: boolean }) {
  const cls = `${collapsed ? 'w-5 h-5' : 'w-5 h-5'} rounded object-contain shrink-0`;
  if (icon && (icon.startsWith('http') || icon.startsWith('/'))) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt=""
        className={cls}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
    </svg>
  );
}

export default function Sidebar({ user, mobileOpen, onMobileClose, enabledModuleSlugs, tabs, donation }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      fetch('/api/messages/unread')
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { count: number } | null) => { if (data) setUnread(data.count); })
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60_000);
    return () => clearInterval(id);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  const isVisible = (requiredModules: string[]) => {
    if (requiredModules.length === 0) return true;
    return requiredModules.some((slug) => enabledModuleSlugs.includes(slug));
  };

  const visibleTabs = tabs.filter((tab) => {
    if (tab.minRole === 'admin') return user.role === 'admin';
    return true;
  });

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-(--color-surface) text-(--color-accent)'
        : 'text-(--color-sidebar-text) hover:text-(--color-text) hover:bg-(--color-surface)'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-14 shrink-0 border-b border-(--color-border)">
        {!collapsed && (
          <span className="text-(--color-text) font-semibold tracking-tight text-base">Atrium</span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface) transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            {collapsed
              ? <path d="M9 18l6-6-6-6" />
              : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          if (!isVisible(item.requiredModules)) return null;
          const isMessages = item.href === '/messages';
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={navLinkClass(isActive(item.href))}
            >
              {isMessages ? (
                <span className="relative shrink-0">
                  {item.icon}
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </span>
              ) : item.icon}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Service tabs */}
        {visibleTabs.length > 0 && (
          <>
            <div className={`pt-4 pb-1 ${collapsed ? 'px-2' : 'px-2.5'}`}>
              {collapsed
                ? <div className="border-t border-(--color-border)" />
                : <span className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest">Services</span>
              }
            </div>
            {visibleTabs.map((tab) => {
              const active = isActive(`/tab/${tab.slug}`);
              if (tab.openInIframe) {
                return (
                  <Link
                    key={tab.id}
                    href={`/tab/${tab.slug}`}
                    onClick={onMobileClose}
                    className={navLinkClass(active)}
                  >
                    <TabIcon icon={tab.icon} collapsed={collapsed} />
                    {!collapsed && <span className="truncate">{tab.label}</span>}
                  </Link>
                );
              }
              return (
                <a
                  key={tab.id}
                  href={tab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onMobileClose}
                  className={navLinkClass(false)}
                >
                  <TabIcon icon={tab.icon} collapsed={collapsed} />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{tab.label}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0 text-(--color-text-muted)">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </>
                  )}
                </a>
              );
            })}
          </>
        )}

        {/* Admin section */}
        {user.role === 'admin' && (
          <>
            <div className={`pt-4 pb-1 ${collapsed ? 'px-2' : 'px-2.5'}`}>
              {collapsed
                ? <div className="border-t border-(--color-border)" />
                : <span className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest">Admin</span>
              }
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={navLinkClass(isActive(item.href))}
              >
                {item.icon}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Donation — sidebar placement */}
      {donation && !collapsed && (
        <div className="shrink-0 px-2 pb-1">
          <DonationWidget url={donation.url} label={donation.label} compact />
        </div>
      )}

      {/* User section */}
      <div className="shrink-0 border-t border-(--color-border) p-2">
        <div className={`flex items-center gap-2.5 px-1 py-1.5 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
          <UserAvatar username={user.username} />
          {!collapsed && (
            <span className="flex-1 text-sm font-medium text-(--color-text) truncate">{user.username}</span>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-(--color-text-muted) hover:text-(--color-text) transition-colors p-1 rounded hover:bg-(--color-surface)"
              aria-label="Sign out"
              title="Sign out"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center justify-center w-full mt-1 p-2 rounded-lg text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface) transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-(--color-sidebar) border-r border-(--color-border) transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-(--color-sidebar) border-r border-(--color-border) transition-[width] duration-200 ease-in-out overflow-hidden ${
          collapsed ? 'w-15' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
