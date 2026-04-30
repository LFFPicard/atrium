import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getModule, isModuleEnabled, updateModuleConfig } from '@/lib/modules';

function getOrCreateWebhookSecret(): string {
  const record = getModule('webhooks');
  const existing = record.config['webhook_secret'];
  if (existing) return existing;
  const secret = randomBytes(32).toString('hex');
  updateModuleConfig('webhooks', { ...record.config, webhook_secret: secret });
  return secret;
}

function validateSecret(req: NextRequest, expected: string): boolean {
  const headerSecret = req.headers.get('x-webhook-secret');
  if (headerSecret) return headerSecret === expected;
  const { searchParams } = new URL(req.url);
  const querySecret = searchParams.get('secret');
  return querySecret === expected;
}

export async function POST(req: NextRequest) {
  if (!isModuleEnabled('webhooks')) {
    return NextResponse.json({ error: 'Webhooks module is not enabled' }, { status: 503 });
  }

  const secret = getOrCreateWebhookSecret();
  if (!validateSecret(req, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Payload processing not yet implemented
  return NextResponse.json({ ok: true });
}
