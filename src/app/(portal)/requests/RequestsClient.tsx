'use client';

import { useState, useEffect } from 'react';

interface OverseerrUser {
  id: number;
  username: string;
  displayName?: string;
}

interface OverseerrMedia {
  id: number;
  mediaType: string;
  posterPath?: string;
  tmdbId: number;
  title?: string;
  name?: string;
}

interface OverseerrRequest {
  id: number;
  status: number;
  type: 'movie' | 'tv';
  media: OverseerrMedia;
  requestedBy: OverseerrUser;
  createdAt: string;
}

interface OverseerrResponse {
  pageInfo: { pages: number; pageSize: number; results: number; page: number };
  results: OverseerrRequest[];
}

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  1: { label: 'Pending',    cls: 'text-amber-400 bg-amber-400/10' },
  2: { label: 'Approved',   cls: 'text-blue-400 bg-blue-400/10' },
  3: { label: 'Declined',   cls: 'text-red-400 bg-red-400/10' },
  4: { label: 'Available',  cls: 'text-green-400 bg-green-400/10' },
  5: { label: 'Processing', cls: 'text-purple-400 bg-purple-400/10' },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function getTitle(req: OverseerrRequest): string {
  return req.media.title ?? req.media.name ?? `${req.type === 'movie' ? 'Movie' : 'TV'} #${req.media.tmdbId}`;
}

function PosterImage({ posterPath, title }: { posterPath?: string; title: string }) {
  const [failed, setFailed] = useState(false);

  if (!posterPath || failed) {
    return (
      <div className="w-14 h-20 rounded bg-(--color-bg) border border-(--color-border) flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-(--color-text-muted)">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://image.tmdb.org/t/p/w200${posterPath}`}
      alt={title}
      className="w-14 h-20 rounded object-cover shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function RequestCard({
  request,
  isAdmin,
  onApprove,
  onDecline,
  actionPending,
}: {
  request: OverseerrRequest;
  isAdmin: boolean;
  onApprove?: (id: number) => void;
  onDecline?: (id: number) => void;
  actionPending?: number | null;
}) {
  const title = getTitle(request);
  const statusInfo = STATUS_MAP[request.status] ?? { label: 'Unknown', cls: 'text-(--color-text-muted) bg-(--color-surface)' };
  const isPending = request.status === 1;
  const isActing = actionPending === request.id;

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-(--color-surface) border border-(--color-border)">
      <PosterImage posterPath={request.media.posterPath} title={title} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="font-semibold text-(--color-text) text-sm leading-snug line-clamp-2">{title}</p>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${request.type === 'movie' ? 'bg-blue-500/15 text-blue-400' : 'bg-violet-500/15 text-violet-400'}`}>
              {request.type === 'movie' ? 'Movie' : 'TV'}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-(--color-text-muted) mb-0.5">
          Requested by <span className="text-(--color-text)">{request.requestedBy.displayName ?? request.requestedBy.username}</span>
        </p>
        <p className="text-xs text-(--color-text-muted)">{formatDate(request.createdAt)}</p>
        {isAdmin && isPending && onApprove && onDecline && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onApprove(request.id)}
              disabled={isActing}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50"
            >
              {isActing ? 'Working…' : 'Approve'}
            </button>
            <button
              onClick={() => onDecline(request.id)}
              disabled={isActing}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
            >
              {isActing ? 'Working…' : 'Decline'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 rounded-xl bg-(--color-surface) border border-(--color-border) animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-(--color-text-muted) mb-3">
        <path d="M9 12h6M9 16h6M7 8h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
      <p className="text-sm font-medium text-(--color-text)">{message}</p>
      {sub && <p className="text-xs text-(--color-text-muted) mt-1">{sub}</p>}
    </div>
  );
}

function PendingTab({ isAdmin, username }: { isAdmin: boolean; username: string }) {
  const [requests, setRequests] = useState<OverseerrRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/modules/overseerr?endpoint=requests&filter=pending&take=100&skip=0');
        if (!res.ok) throw new Error('Failed to load');
        const data: OverseerrResponse = await res.json();
        setRequests(data.results ?? []);
      } catch {
        setError('Failed to load pending requests.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAction(id: number, action: 'approve' | 'decline') {
    setActionPending(id);
    try {
      await fetch(`/api/modules/overseerr?endpoint=request/${id}/${action}`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setActionPending(null);
    }
  }

  const visible = isAdmin
    ? requests
    : requests.filter(
        (r) => r.requestedBy.username === username || (r.requestedBy.displayName ?? '') === username,
      );

  if (loading) return <SkeletonCards />;
  if (error) return <p className="text-sm text-(--color-text-muted) text-center py-8">{error}</p>;
  if (visible.length === 0) return <EmptyState message="No pending requests" sub="All caught up!" />;

  return (
    <div className="flex flex-col gap-3">
      {visible.map((req) => (
        <RequestCard
          key={req.id}
          request={req}
          isAdmin={isAdmin}
          onApprove={(id) => handleAction(id, 'approve')}
          onDecline={(id) => handleAction(id, 'decline')}
          actionPending={actionPending}
        />
      ))}
    </div>
  );
}

const PAGE_SIZE = 20;

function AllRequestsTab({ isAdmin }: { isAdmin: boolean }) {
  const [requests, setRequests] = useState<OverseerrRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  async function load(skip: number, append: boolean) {
    if (skip === 0) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch(`/api/modules/overseerr?endpoint=requests&filter=all&take=${PAGE_SIZE}&skip=${skip}`);
      if (!res.ok) throw new Error('Failed to load');
      const data: OverseerrResponse = await res.json();
      setTotal(data.pageInfo.results);
      if (append) {
        setRequests((prev) => [...prev, ...(data.results ?? [])]);
      } else {
        setRequests(data.results ?? []);
      }
    } catch {
      setError('Failed to load requests.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => { load(0, false); }, []);

  if (loading) return <SkeletonCards />;
  if (error) return <p className="text-sm text-(--color-text-muted) text-center py-8">{error}</p>;
  if (requests.length === 0) return <EmptyState message="No requests yet" />;

  const hasMore = requests.length < total;

  return (
    <div className="flex flex-col gap-3">
      {requests.map((req) => (
        <RequestCard key={req.id} request={req} isAdmin={isAdmin} />
      ))}
      {hasMore && (
        <button
          onClick={() => load(requests.length, true)}
          disabled={loadingMore}
          className="w-full py-2.5 text-sm font-medium rounded-xl border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-text-muted) transition-colors disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

export default function RequestsClient({ isAdmin, username }: { isAdmin: boolean; username: string }) {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  return (
    <div>
      <div className="flex gap-1 p-1 rounded-xl bg-(--color-surface) border border-(--color-border) mb-6 w-fit">
        {(['pending', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-(--color-accent) text-(--color-accent-text)'
                : 'text-(--color-text-muted) hover:text-(--color-text)'
            }`}
          >
            {t === 'pending' ? 'Pending' : 'All Requests'}
          </button>
        ))}
      </div>

      {tab === 'pending' ? (
        <PendingTab isAdmin={isAdmin} username={username} />
      ) : (
        <AllRequestsTab isAdmin={isAdmin} />
      )}
    </div>
  );
}
