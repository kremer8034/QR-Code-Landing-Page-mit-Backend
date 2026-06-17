import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// A single, stable manifest for the whole system. The app is installed once;
// its start_url ("/app") always reopens the most recently scanned vehicle.
export async function GET() {
  const settings = await getSettings();
  const manifest = {
    name: settings.app_name,
    short_name: settings.app_name.slice(0, 18),
    description: 'Fahrzeug-Landingpages per QR-Code',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: settings.primary_color || '#e2001a',
    icons: [
      { src: '/api/icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/api/icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'content-type': 'application/manifest+json' },
  });
}
