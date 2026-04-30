import { getModule, isModuleEnabled } from '@/lib/modules';

function base(url: string) {
  return url.replace(/\/+$/, '');
}

interface UserNameRow {
  user_id: number;
  username: string;
  friendly_name: string;
}

interface GetUserNamesResponse {
  response?: {
    data?: UserNameRow[];
  };
}

export async function findTautulliUserId(username: string): Promise<number | null> {
  if (!isModuleEnabled('tautulli')) return null;
  const record = getModule('tautulli');
  const url = record.config['tautulli_url'];
  const key = record.config['tautulli_api_key'];
  if (!url || !key) return null;

  try {
    const params = new URLSearchParams({ apikey: key, cmd: 'get_user_names' });
    const res = await fetch(`${base(url)}/api?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as GetUserNamesResponse;
    const users = data?.response?.data ?? [];
    const lc = username.toLowerCase();
    const match = users.find(
      (u) => u.username.toLowerCase() === lc || u.friendly_name.toLowerCase() === lc,
    );
    return match?.user_id ?? null;
  } catch {
    return null;
  }
}
