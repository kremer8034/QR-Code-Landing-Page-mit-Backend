import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Alert, Card, CardBody, LinkButton, PageHeader } from '@/components/ui';
import type { Group, Vehicle } from '@/lib/types';
import { VehicleListClient } from './VehicleListClient';

export const dynamic = 'force-dynamic';

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; imported?: string; skipped?: string; deleted?: string }>;
}) {
  const sp = await searchParams;
  const supabase = getSupabaseAdmin();

  const { data: groups } = await supabase.from('groups').select('*').order('name');
  const groupList = (groups as Group[]) ?? [];
  const groupMap = new Map(groupList.map((g) => [g.id, g]));

  let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });
  if (sp.group) query = query.eq('group_id', sp.group);
  if (sp.q) {
    const q = sp.q.replace(/[%,]/g, ' ');
    query = query.or(`license_plate.ilike.%${q}%,name.ilike.%${q}%,vin.ilike.%${q}%`);
  }
  const { data: vehicles } = await query;
  const list = (vehicles as Vehicle[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Fahrzeuge"
        subtitle={`${list.length} Fahrzeug${list.length === 1 ? '' : 'e'}`}
        action={
          <div className="flex gap-2">
            <LinkButton href="/admin/vehicles/import" variant="ghost">Import (Excel)</LinkButton>
            <LinkButton href="/admin/vehicles/new">Neues Fahrzeug</LinkButton>
          </div>
        }
      />

      {sp.imported ? (
        <div className="mb-4">
          <Alert kind="success">
            {sp.imported} Fahrzeug(e) importiert{sp.skipped && sp.skipped !== '0' ? `, ${sp.skipped} übersprungen` : ''}.
          </Alert>
        </div>
      ) : null}

      <Card className="mb-4">
        <CardBody>
          <form className="flex flex-col sm:flex-row gap-3" method="get">
            <input
              name="q"
              defaultValue={sp.q ?? ''}
              placeholder="Suche nach Kennzeichen, Name, FIN…"
              className="flex-1 rounded-xl ring-1 ring-gray-300 px-3.5 py-2.5"
            />
            <select name="group" defaultValue={sp.group ?? ''} className="rounded-xl ring-1 ring-gray-300 px-3.5 py-2.5">
              <option value="">Alle Gruppen</option>
              {groupList.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button className="rounded-xl px-4 py-2.5 font-semibold bg-gray-900 text-white">Filtern</button>
          </form>
        </CardBody>
      </Card>

      {list.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-gray-500 text-center py-8">
              Keine Fahrzeuge gefunden.{' '}
              <Link href="/admin/vehicles/new" className="font-semibold" style={{ color: 'var(--brand)' }}>
                Erstes Fahrzeug anlegen
              </Link>{' '}
              oder per <Link href="/admin/vehicles/import" className="font-semibold" style={{ color: 'var(--brand)' }}>Excel-Import</Link>.
            </p>
          </CardBody>
        </Card>
      ) : (
        <VehicleListClient
          vehicles={list.map((v) => ({
            id: v.id,
            public_id: v.public_id,
            license_plate: v.license_plate,
            name: v.name,
            active: v.active,
            group: v.group_id ? groupMap.get(v.group_id)?.name ?? null : null,
            groupColor: v.group_id ? groupMap.get(v.group_id)?.color ?? null : null,
          }))}
        />
      )}
    </div>
  );
}
