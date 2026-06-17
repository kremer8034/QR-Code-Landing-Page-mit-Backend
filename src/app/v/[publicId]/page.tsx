import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVehicleByPublicId, resolveVehicleLinks } from '@/lib/queries';
import { getSettings, themeStyle } from '@/lib/settings';
import { getSupabaseAdmin } from '@/lib/supabase';
import { LandingClient } from './LandingClient';
import { ContentList } from './ContentList';
import type { Group } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const vehicle = await getVehicleByPublicId(publicId);
  const settings = await getSettings();
  const title = vehicle
    ? `${vehicle.license_plate || vehicle.name || 'Fahrzeug'} · ${settings.app_name}`
    : settings.app_name;
  return {
    title,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: settings.app_name },
  };
}

export default async function VehicleLanding({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const vehicle = await getVehicleByPublicId(publicId);
  if (!vehicle) notFound();

  const settings = await getSettings();
  const links = await resolveVehicleLinks(vehicle);

  let group: Group | null = null;
  if (vehicle.group_id) {
    const { data } = await getSupabaseAdmin().from('groups').select('*').eq('id', vehicle.group_id).maybeSingle();
    group = (data as Group) ?? null;
  }

  return (
    <main
      className="min-h-screen bg-gray-50 flex flex-col items-center"
      style={themeStyle(settings) as React.CSSProperties}
    >
      <LandingClient publicId={vehicle.public_id} vehicleId={vehicle.id} />

      <div className="w-full max-w-md px-5 pb-16">
        {/* Header */}
        <header className="pt-8 pb-6 flex flex-col items-center text-center gap-3">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt={settings.app_name} className="h-12 object-contain" />
          ) : null}
          <div
            className="mt-2 rounded-2xl px-6 py-4 w-full"
            style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
          >
            <div className="text-xs uppercase tracking-wider opacity-80">Fahrzeug</div>
            <div className="text-3xl font-extrabold leading-tight break-words">
              {vehicle.license_plate || vehicle.name || 'Fahrzeug'}
            </div>
            {vehicle.name && vehicle.name !== vehicle.license_plate ? (
              <div className="text-sm opacity-90 mt-1">{vehicle.name}</div>
            ) : null}
            {group ? (
              <div className="inline-block mt-3 text-xs font-medium rounded-full px-3 py-1 bg-black/20">
                {group.name}
              </div>
            ) : null}
          </div>
        </header>

        {/* Content elements */}
        <nav>
          <ContentList items={links} publicId={vehicle.public_id} />
        </nav>

        <footer className="mt-10 text-center text-xs text-gray-400">
          {settings.app_name}
        </footer>
      </div>
    </main>
  );
}
