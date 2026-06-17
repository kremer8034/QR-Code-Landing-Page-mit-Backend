import { getSupabaseAdmin } from '@/lib/supabase';
import { getSettings, resolveBaseUrl } from '@/lib/settings';
import { buildLabelPdf } from '@/lib/labels';
import { requireSession } from '@/lib/guard';
import type { Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function loadLogo(logoUrl: string | null): Promise<Uint8Array | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function generate(request: Request, ids: string[]) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('vehicles').select('*').in('id', ids);
  const map = new Map((data as Vehicle[] ?? []).map((v) => [v.id, v]));
  // Preserve the requested order.
  const vehicles = ids.map((id) => map.get(id)).filter(Boolean) as Vehicle[];
  if (vehicles.length === 0) return new Response('keine Fahrzeuge', { status: 400 });

  const settings = await getSettings();
  const origin = new URL(request.url).origin;
  const baseUrl = resolveBaseUrl(settings, origin);
  const logo = await loadLogo(settings.logo_url);

  const pdf = await buildLabelPdf(vehicles, settings, baseUrl, logo);
  const filename = vehicles.length === 1
    ? `Etikett_${(vehicles[0].license_plate || vehicles[0].public_id).replace(/[^a-zA-Z0-9_-]+/g, '_')}.pdf`
    : `Etiketten_${vehicles.length}_Fahrzeuge.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: Request) {
  await requireSession();
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get('ids') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return new Response('keine IDs', { status: 400 });
  return generate(request, ids);
}

export async function POST(request: Request) {
  await requireSession();
  const body = await request.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) return new Response('keine IDs', { status: 400 });
  return generate(request, ids);
}
