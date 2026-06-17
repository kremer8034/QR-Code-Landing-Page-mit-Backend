import { createHash } from 'node:crypto';
import { recordScan } from '@/lib/queries';
import { isUuid } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const vehicleId = typeof body.vehicleId === 'string' ? body.vehicleId : null;
    if (!vehicleId || !isUuid(vehicleId)) return new Response('bad request', { status: 400 });

    const ua = request.headers.get('user-agent') ?? undefined;
    const referrer = request.headers.get('referer') ?? undefined;
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '';
    // Store only a salted hash of the IP (privacy: no raw IPs persisted).
    const ipHash = ip
      ? createHash('sha256').update(ip + (process.env.SESSION_SECRET ?? 'salt')).digest('hex').slice(0, 32)
      : undefined;

    await recordScan(vehicleId, { ua, referrer, ipHash });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
