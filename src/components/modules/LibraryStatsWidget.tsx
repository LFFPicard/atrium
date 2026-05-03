'use client';

import { useState, useEffect } from 'react';

interface Library {
  section_id: number;
  section_name: string;
  section_type: string;
  count: string;
  parent_count: string | null;
  child_count: string | null;
}

interface LibrariesResponse {
  response?: { data?: Library[] };
}

function typeIcon(type: string) {
  if (type === 'show') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-(--color-accent)">
        <rect x="2" y="7" width="20" height="15" rx="2" />
        <path d="M16 2l-4 5-4-5" />
      </svg>
    );
  }
  if (type === 'music') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-(--color-accent)">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    );
  }
  if (type === 'photo') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-(--color-accent)">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-(--color-accent)">
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function libraryStat(lib: Library): string {
  const count = parseInt(lib.count, 10) || 0;
  if (lib.section_type === 'show') {
    const eps = parseInt(lib.child_count ?? '0', 10) || 0;
    const showLabel = count === 1 ? 'show' : 'shows';
    return eps > 0
      ? `${count.toLocaleString()} ${showLabel} · ${eps.toLocaleString()} eps`
      : `${count.toLocaleString()} ${showLabel}`;
  }
  if (lib.section_type === 'music') {
    return `${count.toLocaleString()} ${count === 1 ? 'track' : 'tracks'}`;
  }
  if (lib.section_type === 'photo') {
    return `${count.toLocaleString()} ${count === 1 ? 'photo' : 'photos'}`;
  }
  return `${count.toLocaleString()} ${count === 1 ? 'item' : 'items'}`;
}

export default function LibraryStatsWidget() {
  const [libraries, setLibraries] = useState<Library[] | null>(null);

  useEffect(() => {
    fetch('/api/modules/tautulli?cmd=get_libraries')
      .then((r) => r.json())
      .then((d: LibrariesResponse) => {
        const libs = d?.response?.data ?? [];
        setLibraries(libs.filter((l) => l.section_type !== 'photo'));
      })
      .catch(() => {});
  }, []);

  if (libraries === null) return null;
  if (libraries.length === 0) return null;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-(--color-border)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-accent)">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <p className="text-sm font-semibold text-(--color-text)">Libraries</p>
      </div>
      <div className="divide-y divide-(--color-border)">
        {libraries.map((lib) => (
          <div key={lib.section_id} className="flex items-center gap-3 px-4 py-2.5">
            {typeIcon(lib.section_type)}
            <span className="flex-1 text-sm text-(--color-text) truncate">{lib.section_name}</span>
            <span className="text-xs text-(--color-text-muted) tabular-nums shrink-0">{libraryStat(lib)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
