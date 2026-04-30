const store = new Map<string, number[]>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const prev = store.get(key) ?? [];
  const recent = prev.filter((t) => t > cutoff);
  if (recent.length >= max) {
    store.set(key, recent);
    return false;
  }
  recent.push(now);
  store.set(key, recent);
  return true;
}
