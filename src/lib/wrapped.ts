import { db } from '@/lib/db';
import { statsCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getModule, isModuleEnabled } from '@/lib/modules';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WrappedMediaItem {
  title: string;
  plays: number;
  thumb: string | null;
  mediaType: 'show' | 'movie';
}

export interface PlatformCount {
  platform: string;
  plays: number;
}

export interface WrappedSummary {
  year: number;
  totalPlays: number;
  totalSeconds: number;
  topShows: WrappedMediaItem[];
  topMovies: WrappedMediaItem[];
  mostActiveDayIndex: number | null;
  mostActiveHour: number | null;
  dowData: number[];
  hodData: number[];
  firstWatched: WrappedMediaItem | null;
  lastWatched: WrappedMediaItem | null;
  platforms: PlatformCount[];
  monthlyPlays: number[];
  streak: number;
}

// ── Tautulli response shapes ──────────────────────────────────────────────────

interface PlaysDateResp {
  response?: {
    data?: {
      categories?: string[];
      series?: Array<{ name: string; data: number[] }>;
    };
  };
}

interface HomeStatsRow {
  title?: string;
  grandparent_title?: string;
  thumb?: string;
  total_plays?: number;
  count?: number;
  platform?: string;
  duration?: number;
}

interface HomeStatsResp {
  response?: {
    data?: Array<{
      stat_id: string;
      rows?: HomeStatsRow[];
    }>;
  };
}

interface HistoryRow {
  full_title?: string;
  grandparent_title?: string;
  title?: string;
  thumb?: string;
  parent_thumb?: string;
  grandparent_thumb?: string;
  media_type?: string;
}

interface HistoryResp {
  response?: {
    data?: {
      data?: HistoryRow[];
    };
  };
}

// ── Tautulli direct caller ────────────────────────────────────────────────────

function base(url: string) {
  return url.replace(/\/+$/, '');
}

async function tGet<T>(tUrl: string, key: string, params: Record<string, string>): Promise<T | null> {
  try {
    const p = new URLSearchParams({ apikey: key, ...params });
    const res = await fetch(`${base(tUrl)}/api?${p}`, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const FAR_FUTURE = 9_999_999_999;

function readCache(key: string): WrappedSummary | null {
  const row = db.select().from(statsCache).where(eq(statsCache.key, key)).get();
  if (!row) return null;
  const now = Math.floor(Date.now() / 1000);
  if (row.expiresAt !== FAR_FUTURE && row.expiresAt < now) return null;
  try { return JSON.parse(row.data) as WrappedSummary; } catch { return null; }
}

function writeCache(key: string, data: WrappedSummary, isPastYear: boolean): void {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = isPastYear ? FAR_FUTURE : now + 86_400;
  const existing = db.select().from(statsCache).where(eq(statsCache.key, key)).get();
  if (existing) {
    db.update(statsCache).set({ data: JSON.stringify(data), expiresAt }).where(eq(statsCache.key, key)).run();
  } else {
    db.insert(statsCache).values({ key, data: JSON.stringify(data), expiresAt }).run();
  }
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function yearIndices(resp: PlaysDateResp, year: number): number[] {
  return (resp?.response?.data?.categories ?? [])
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.startsWith(String(year)))
    .map(({ i }) => i);
}

function sumAtIndices(resp: PlaysDateResp, indices: number[]): number {
  const series = resp?.response?.data?.series ?? [];
  return indices.reduce(
    (acc, i) => acc + series.reduce((s, ser) => s + (ser.data[i] ?? 0), 0),
    0,
  );
}

function buildHeatArray(resp: PlaysDateResp): number[] {
  const cats = resp?.response?.data?.categories ?? [];
  const series = resp?.response?.data?.series ?? [];
  return cats.map((_, i) => series.reduce((acc, s) => acc + (s.data[i] ?? 0), 0));
}

function buildMonthly(resp: PlaysDateResp, year: number): number[] {
  const cats = resp?.response?.data?.categories ?? [];
  const series = resp?.response?.data?.series ?? [];
  const monthly = Array(12).fill(0) as number[];
  cats.forEach((date, i) => {
    if (!date.startsWith(String(year))) return;
    const m = parseInt(date.slice(5, 7), 10) - 1;
    if (m >= 0 && m < 12) series.forEach((s) => { monthly[m] += s.data[i] ?? 0; });
  });
  return monthly;
}

function calcStreak(resp: PlaysDateResp, year: number): number {
  const cats = resp?.response?.data?.categories ?? [];
  const series = resp?.response?.data?.series ?? [];
  const yearPlayed = cats
    .map((date, i) => ({ inYear: date.startsWith(String(year)), total: series.reduce((a, s) => a + (s.data[i] ?? 0), 0) }))
    .filter(({ inYear }) => inYear)
    .map(({ total }) => total > 0);
  let max = 0; let cur = 0;
  for (const p of yearPlayed) { if (p) { max = Math.max(max, ++cur); } else { cur = 0; } }
  return max;
}

function peakIndex(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((best, v, i, a) => (v > a[best] ? i : best), 0);
}

function rowToItem(r: HomeStatsRow, mediaType: 'show' | 'movie'): WrappedMediaItem {
  return {
    title: (mediaType === 'show' ? (r.grandparent_title ?? r.title) : r.title) ?? 'Unknown',
    plays: r.total_plays ?? r.count ?? 0,
    thumb: r.thumb ?? null,
    mediaType,
  };
}

function histRowToItem(h: HistoryRow): WrappedMediaItem {
  const isMovie = h.media_type === 'movie';
  return {
    title: isMovie ? (h.title ?? h.full_title ?? 'Unknown') : (h.grandparent_title ?? h.title ?? 'Unknown'),
    plays: 1,
    thumb: h.grandparent_thumb ?? h.parent_thumb ?? h.thumb ?? null,
    mediaType: isMovie ? 'movie' : 'show',
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function getWrappedData(
  atriumUserId: string,
  year: number,
  tautulliUserId: number | null,
): Promise<WrappedSummary | null> {
  if (!isModuleEnabled('tautulli')) return null;

  const cacheKey = `tautulli:wrapped:${atriumUserId}:${year}`;
  const isPastYear = year < new Date().getFullYear();

  const cached = readCache(cacheKey);
  if (cached) return cached;

  const record = getModule('tautulli');
  const tUrl = record.config['tautulli_url'];
  const apiKey = record.config['tautulli_api_key'];
  if (!tUrl || !apiKey) return null;

  // time_range: days from Jan 1 of target year to today (cap at 5 years)
  const msFromYearStart = Date.now() - new Date(year, 0, 1).getTime();
  const timeRange = String(Math.min(Math.ceil(msFromYearStart / 86_400_000) + 1, 1825));

  const uid = tautulliUserId ? String(tautulliUserId) : '';
  const up: Record<string, string> = uid ? { user_id: uid } : {};

  const histBase: Record<string, string> = {
    cmd: 'get_history',
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
    length: '1',
    order_column: 'date',
  };
  if (uid) histBase.user_id = uid;

  const [playsResp, durResp, dowResp, hodResp, homeResp, histFirstResp, histLastResp] =
    await Promise.all([
      tGet<PlaysDateResp>(tUrl, apiKey, { cmd: 'get_plays_by_date', time_range: timeRange, ...up }),
      tGet<PlaysDateResp>(tUrl, apiKey, { cmd: 'get_plays_by_date', time_range: timeRange, y_axis: 'duration', ...up }),
      tGet<PlaysDateResp>(tUrl, apiKey, { cmd: 'get_plays_by_dayofweek', time_range: timeRange, ...up }),
      tGet<PlaysDateResp>(tUrl, apiKey, { cmd: 'get_plays_by_hourofday', time_range: timeRange, ...up }),
      tGet<HomeStatsResp>(tUrl, apiKey, { cmd: 'get_home_stats', time_range: timeRange, stats_count: '5', ...up }),
      tGet<HistoryResp>(tUrl, apiKey, { ...histBase, order_dir: 'asc' }),
      tGet<HistoryResp>(tUrl, apiKey, { ...histBase, order_dir: 'desc' }),
    ]);

  // Plays + duration filtered to target year
  const indices = playsResp ? yearIndices(playsResp, year) : [];
  const totalPlays = playsResp ? sumAtIndices(playsResp, indices) : 0;
  const totalSeconds = durResp ? sumAtIndices(durResp, yearIndices(durResp, year)) : 0;

  // Heatmap arrays
  const dowData = dowResp ? buildHeatArray(dowResp) : Array<number>(7).fill(0);
  const hodData = hodResp ? buildHeatArray(hodResp) : Array<number>(24).fill(0);

  // Top shows / movies / platforms from home_stats
  const homeRows = homeResp?.response?.data ?? [];
  const findStat = (id: string): HomeStatsRow[] => homeRows.find((s) => s.stat_id === id)?.rows ?? [];

  const topShows = findStat('top_tv').slice(0, 5).map((r) => rowToItem(r, 'show'));
  const topMovies = findStat('top_movies').slice(0, 5).map((r) => rowToItem(r, 'movie'));
  const platforms: PlatformCount[] = findStat('top_platforms').slice(0, 8).map((r) => ({
    platform: r.platform ?? r.title ?? 'Unknown',
    plays: r.total_plays ?? r.count ?? 0,
  }));

  // Monthly plays and streak from daily data
  const monthlyPlays = playsResp ? buildMonthly(playsResp, year) : Array<number>(12).fill(0);
  const streak = playsResp ? calcStreak(playsResp, year) : 0;

  // First and last watched
  const firstRow = histFirstResp?.response?.data?.data?.[0];
  const lastRow = histLastResp?.response?.data?.data?.[0];
  const firstWatched = firstRow ? histRowToItem(firstRow) : null;
  const lastWatched = lastRow ? histRowToItem(lastRow) : null;

  const summary: WrappedSummary = {
    year,
    totalPlays,
    totalSeconds,
    topShows,
    topMovies,
    mostActiveDayIndex: peakIndex(dowData),
    mostActiveHour: peakIndex(hodData),
    dowData,
    hodData,
    firstWatched,
    lastWatched,
    platforms,
    monthlyPlays,
    streak,
  };

  writeCache(cacheKey, summary, isPastYear);
  return summary;
}
