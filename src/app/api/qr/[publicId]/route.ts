import { getVehicleByPublicId } from '@/lib/queries';
import { getSettings, resolveBaseUrl } from '@/lib/settings';
import { qrPng, qrSvg, vehicleUrl } from '@/lib/qr';
import { requireSession } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  await requireSession();
  const { publicId } = await params;
  const vehicle = await getVehicleByPublicId(publicId);
  if (!vehicle) return new Response('not found', { status: 404 });

  const settings = await getSettings();
  const origin = new URL(request.url).origin;
  const baseUrl = resolveBaseUrl(settings, origin);
  const target = vehicleUrl(baseUrl, publicId);

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'png';
  const download = searchParams.get('download') === '1';
  const fileBase = (vehicle.license_plate || vehicle.public_id).replace(/[^a-zA-Z0-9_-]+/g, '_');

  if (format === 'svg') {
    const svg = await qrSvg(target);
    return new Response(svg, {
      headers: {
        'content-type': 'image/svg+xml',
        ...(download ? { 'content-disposition': `attachment; filename="QR_${fileBase}.svg"` } : {}),
      },
    });
  }

  const scale = Math.min(20, Math.max(4, parseInt(searchParams.get('scale') ?? '12', 10) || 12));
  const png = await qrPng(target, { scale });
  return new Response(new Uint8Array(png), {
    headers: {
      'content-type': 'image/png',
      ...(download ? { 'content-disposition': `attachment; filename="QR_${fileBase}.png"` } : {}),
    },
  });
}
