import { getSupabaseAdmin } from '@/lib/supabase';
import { Card, CardBody, PageHeader } from '@/components/ui';
import type { Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Pull recent scans (cap to a sane number) and aggregate in memory.
  const { data: scans } = await supabase
    .from('scans')
    .select('vehicle_id, created_at')
    .gte('created_at', since30)
    .order('created_at', { ascending: false })
    .limit(20000);

  const list = (scans as { vehicle_id: string; created_at: string }[]) ?? [];

  const day = 24 * 60 * 60 * 1000;
  let last24 = 0;
  let last7 = 0;
  const perVehicle = new Map<string, { count: number; last: string }>();
  for (const s of list) {
    const t = new Date(s.created_at).getTime();
    if (now - t <= day) last24++;
    if (now - t <= 7 * day) last7++;
    const cur = perVehicle.get(s.vehicle_id);
    if (!cur) perVehicle.set(s.vehicle_id, { count: 1, last: s.created_at });
    else cur.count++;
  }

  const { count: total } = await supabase.from('scans').select('id', { count: 'exact', head: true });

  const ranked = [...perVehicle.entries()].sort((a, b) => b[1].count - a[1].count);
  let vehicleMap = new Map<string, Vehicle>();
  if (ranked.length) {
    const { data: vs } = await supabase.from('vehicles').select('*').in('id', ranked.map(([id]) => id));
    vehicleMap = new Map((vs as Vehicle[] ?? []).map((v) => [v.id, v]));
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });

  const cards = [
    { label: 'Letzte 24 Stunden', value: last24 },
    { label: 'Letzte 7 Tage', value: last7 },
    { label: 'Letzte 30 Tage', value: list.length },
    { label: 'Gesamt', value: total ?? 0 },
  ];

  return (
    <div>
      <PageHeader title="Statistik" subtitle="QR-Code-Aufrufe pro Fahrzeug" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardBody>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <div className="text-sm text-gray-500">{c.label}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Aufrufe pro Fahrzeug (30 Tage)</h2>
          </div>
          {ranked.length === 0 ? (
            <p className="text-gray-500 text-center py-10">Noch keine Aufrufe erfasst.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Fahrzeug</th>
                  <th className="px-5 py-3 font-medium">Gruppe</th>
                  <th className="px-5 py-3 font-medium text-right">Aufrufe</th>
                  <th className="px-5 py-3 font-medium">Letzter Aufruf</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(([id, info]) => {
                  const v = vehicleMap.get(id);
                  return (
                    <tr key={id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{v?.license_plate ?? '—'} {v?.name ? <span className="text-gray-400">· {v.name}</span> : null}</td>
                      <td className="px-5 py-3 text-gray-500">—</td>
                      <td className="px-5 py-3 text-right font-bold">{info.count}</td>
                      <td className="px-5 py-3 text-gray-500">{fmt(info.last)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
