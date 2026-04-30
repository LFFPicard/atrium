'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TabRow } from '@/lib/tabs';

function TabIcon({ icon }: { icon: string }) {
  const [err, setErr] = useState(false);
  const isUrl = icon && (icon.startsWith('http') || icon.startsWith('/'));

  if (isUrl && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt=""
        className="w-8 h-8 object-contain"
        onError={() => setErr(true)}
      />
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-(--color-text-muted)">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
    </svg>
  );
}

const cardClass =
  'flex flex-col items-center gap-2 p-3 rounded-xl border border-(--color-border) bg-(--color-bg) hover:border-(--color-accent) hover:bg-(--color-surface) transition-colors cursor-pointer text-center';

export default function QuickLinksWidget({ tabs }: { tabs: TabRow[] }) {
  if (tabs.length === 0) return null;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        <p className="text-sm font-semibold text-(--color-text)">Quick Links</p>
      </div>
      <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {tabs.map((tab) => {
          const href = tab.openInIframe ? `/tab/${tab.slug}` : tab.url;
          const external = !tab.openInIframe;

          const content = (
            <>
              <TabIcon icon={tab.icon} />
              <span className="text-xs font-medium text-(--color-text-muted) group-hover:text-(--color-text) transition-colors truncate w-full text-center leading-tight">
                {tab.label}
              </span>
              {external && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-(--color-text-muted) absolute top-2 right-2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              )}
            </>
          );

          if (external) {
            return (
              <a
                key={tab.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cardClass} group relative`}
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={tab.id} href={href} className={`${cardClass} group relative`}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
