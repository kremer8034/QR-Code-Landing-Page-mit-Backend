import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/settings';
import { contrastText } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Generates a branded PWA/app icon as PNG at the requested size.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(1024, Math.max(48, parseInt(searchParams.get('size') ?? '192', 10) || 192));
  const settings = await getSettings();
  const bg = settings.primary_color || '#e2001a';
  const fg = contrastText(bg);
  const initials = (settings.app_name || 'QR')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'QR';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          color: fg,
          fontSize: Math.round(size * 0.42),
          fontWeight: 800,
          borderRadius: Math.round(size * 0.18),
        }}
      >
        {initials}
      </div>
    ),
    { width: size, height: size },
  );
}
