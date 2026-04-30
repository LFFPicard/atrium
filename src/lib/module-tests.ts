export interface TestResult {
  success: boolean;
  message: string;
  version?: string;
}

async function fetchWithTimeout(url: string, init?: RequestInit, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function base(url: string): string {
  return url.replace(/\/+$/, '');
}

function httpError(res: Response): TestResult {
  if (res.status === 401 || res.status === 403) {
    return { success: false, message: 'Authentication failed — check your API key' };
  }
  if (res.status === 404) {
    return { success: false, message: 'API endpoint not found — check the service URL' };
  }
  return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
}

function networkError(err: unknown): TestResult {
  const e = err as Error;
  if (e.name === 'AbortError') return { success: false, message: 'Connection timed out after 5 seconds' };
  const msg = e.message ?? String(err);
  if (msg.includes('ECONNREFUSED')) return { success: false, message: 'Connection refused — is the service running?' };
  if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) return { success: false, message: 'Host not found — check the URL' };
  return { success: false, message: `Connection failed: ${msg}` };
}

async function testTautulli(config: Record<string, string>): Promise<TestResult> {
  const { tautulli_url: url, tautulli_api_key: key } = config;
  if (!url || !key) return { success: false, message: 'Missing required config' };
  try {
    const res = await fetchWithTimeout(`${base(url)}/api?apikey=${encodeURIComponent(key)}&cmd=get_server_info`);
    if (!res.ok) return httpError(res);
    const json = await res.json() as {
      response?: { result?: string; message?: string; data?: { pms_version?: string } };
    };
    if (json.response?.result !== 'success') {
      return { success: false, message: json.response?.message ?? 'Tautulli returned an error — check your API key' };
    }
    return { success: true, message: 'Connected successfully', version: json.response.data?.pms_version };
  } catch (err) {
    return networkError(err);
  }
}

async function testSonarr(config: Record<string, string>): Promise<TestResult> {
  const { sonarr_url: url, sonarr_api_key: key } = config;
  if (!url || !key) return { success: false, message: 'Missing required config' };
  try {
    const res = await fetchWithTimeout(`${base(url)}/api/v3/system/status?apikey=${encodeURIComponent(key)}`);
    if (!res.ok) return httpError(res);
    const json = await res.json() as { version?: string };
    return { success: true, message: 'Connected successfully', version: json.version };
  } catch (err) {
    return networkError(err);
  }
}

async function testRadarr(config: Record<string, string>): Promise<TestResult> {
  const { radarr_url: url, radarr_api_key: key } = config;
  if (!url || !key) return { success: false, message: 'Missing required config' };
  try {
    const res = await fetchWithTimeout(`${base(url)}/api/v3/system/status?apikey=${encodeURIComponent(key)}`);
    if (!res.ok) return httpError(res);
    const json = await res.json() as { version?: string };
    return { success: true, message: 'Connected successfully', version: json.version };
  } catch (err) {
    return networkError(err);
  }
}

async function testJellyfin(config: Record<string, string>): Promise<TestResult> {
  const { jellyfin_url: url, jellyfin_api_key: key } = config;
  if (!url || !key) return { success: false, message: 'Missing required config' };
  try {
    const res = await fetchWithTimeout(`${base(url)}/System/Info?api_key=${encodeURIComponent(key)}`);
    if (!res.ok) return httpError(res);
    const json = await res.json() as { Version?: string; ServerName?: string };
    return {
      success: true,
      message: json.ServerName ? `Connected to "${json.ServerName}"` : 'Connected successfully',
      version: json.Version,
    };
  } catch (err) {
    return networkError(err);
  }
}

async function testOverseerr(config: Record<string, string>): Promise<TestResult> {
  const { overseerr_url: url, overseerr_api_key: key } = config;
  if (!url || !key) return { success: false, message: 'Missing required config' };
  try {
    const res = await fetchWithTimeout(`${base(url)}/api/v1/status`, {
      headers: { 'X-Api-Key': key },
    });
    if (!res.ok) return httpError(res);
    const json = await res.json() as { version?: string };
    return { success: true, message: 'Connected successfully', version: json.version };
  } catch (err) {
    return networkError(err);
  }
}

const HANDLERS: Record<string, (config: Record<string, string>) => Promise<TestResult>> = {
  tautulli: testTautulli,
  sonarr: testSonarr,
  radarr: testRadarr,
  jellyfin: testJellyfin,
  overseerr: testOverseerr,
};

export async function testModuleConnection(slug: string, config: Record<string, string>): Promise<TestResult> {
  const handler = HANDLERS[slug];
  if (!handler) return { success: false, message: 'No connection test available for this module' };
  return handler(config);
}
