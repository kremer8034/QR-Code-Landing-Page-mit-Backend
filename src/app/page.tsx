import Link from 'next/link';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getSettings();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center bg-gray-50">
      {settings.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logo_url} alt={settings.app_name} className="h-16 object-contain" />
      ) : null}
      <h1 className="text-3xl font-bold text-gray-900">{settings.app_name}</h1>
      <p className="max-w-md text-gray-600">
        QR-Code-Verwaltung für den Fuhrpark. Scannen Sie den QR-Code an Ihrem Fahrzeug, um die
        Fahrzeug-Seite zu öffnen.
      </p>
      <Link
        href="/admin"
        className="rounded-xl px-6 py-3 font-semibold btn-brand transition-colors"
      >
        Zum Backoffice
      </Link>
    </main>
  );
}
