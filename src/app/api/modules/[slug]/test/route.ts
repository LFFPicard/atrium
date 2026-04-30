import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getModule, MODULE_DEFINITIONS } from '@/lib/modules';
import { testModuleConnection } from '@/lib/module-tests';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { slug } = await params;

  if (!MODULE_DEFINITIONS.find((d) => d.slug === slug)) {
    return NextResponse.json({ error: 'Unknown module' }, { status: 404 });
  }

  const record = getModule(slug);
  const result = await testModuleConnection(slug, record.config);

  return NextResponse.json(result);
}
