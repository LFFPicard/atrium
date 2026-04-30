import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import {
  getAllModules,
  MODULE_DEFINITIONS,
  enableModule,
  disableModule,
  updateModuleConfig,
  isModuleConfigured,
  getModule,
} from '@/lib/modules';
import { syncModuleUptimeCheck } from '@/lib/uptime/sync';

const SENSITIVE_PATTERNS = ['key', 'secret', 'password', 'pass', 'token'];

function isSensitive(fieldKey: string): boolean {
  const lower = fieldKey.toLowerCase();
  return SENSITIVE_PATTERNS.some((p) => lower.includes(p));
}

function maskConfig(slug: string, config: Record<string, string>): Record<string, string> {
  const def = MODULE_DEFINITIONS.find((d) => d.slug === slug);
  if (!def) return config;
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) {
    masked[k] = isSensitive(k) && v ? '••••••••' : v;
  }
  return masked;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const records = getAllModules();
  const data = MODULE_DEFINITIONS.map((def) => {
    const record = records.find((r) => r.id === def.slug) ?? { id: def.slug, enabled: false, config: {} };
    return {
      slug: def.slug,
      name: def.name,
      description: def.description,
      configFields: def.configFields,
      unlocks: def.unlocks,
      enabled: record.enabled,
      configured: isModuleConfigured(def.slug),
      config: maskConfig(def.slug, record.config),
    };
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json() as {
    slug: string;
    enabled?: boolean;
    config?: Record<string, string>;
  };

  const { slug, enabled, config } = body;

  if (!MODULE_DEFINITIONS.find((d) => d.slug === slug)) {
    return NextResponse.json({ error: 'Unknown module slug' }, { status: 400 });
  }

  if (config !== undefined) {
    updateModuleConfig(slug, config);
  }

  if (enabled !== undefined) {
    if (enabled) enableModule(slug);
    else disableModule(slug);
  }

  const finalRecord = getModule(slug);
  syncModuleUptimeCheck(slug, finalRecord.enabled, finalRecord.config);

  return NextResponse.json({ ok: true });
}
