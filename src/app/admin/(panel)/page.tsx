import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Card, CardBody, LinkButton, PageHeader } from '@/components/ui';
import { Car, ChevronRight, FolderTree, Link2, ScanLine } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function Dashboard() {
  const supabase = getSupabaseAdmin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [vehicles, groups, links, scansTotal, scans7d] = await Promise.all([
    count('vehicles'),
    count('groups'),
    count('links'),
    count('scans'),
    count('scans', (q) => q.gte('created_at', sevenDaysAgo)),
  ]);

  // Top vehicles by scans (last 30 days)
  const { data: recentScans } = await supabase
    .from('scans')
    .select('vehicle_id')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const tally = new Map<string, number>();
  for (const s of (recentScans as { vehicle_id: string }[]) ?? []) {
    tally.set(s.vehicle_id, (tally.get(s.vehicle_id) ?? 0) + 1);
  }
  const topIds = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  let topVehicles: { id: string; license_plate: string; name: string; count: number }[] = [];
  if (topIds.length) {
    const { data: vs } = await supabase
      .from('vehicles')
      .select('id, license_plate, name')
      .in('id', topIds.map(([id]) => id));
    const vmap = new Map((vs as any[] ?? []).map((v) => [v.id, v]));
    topVehicles = topIds.map(([id, c]) => ({
      id,
      license_plate: vmap.get(id)?.license_plate ?? '—',
      name: vmap.get(id)?.name ?? '',
      count: c,
    }));
  }

  const stats = [
    { label: 'Fahrzeuge', value: vehicles, icon: Car, href: '/admin/vehicles' },
    { label: 'Gruppen', value: groups, icon: FolderTree, href: '/admin/groups' },
    { label: 'Links', value: links, icon: Link2, href: '/admin/links' },
    { label: 'Scans gesamt', value: scansTotal, icon: ScanLine, href: '/admin/stats' },
  ];

  return (
    <div>
      <PageHeader
        title="Übersicht"
        subtitle="Willkommen im Backoffice"
        action={<LinkButton href="/admin/vehicles/new">Neues Fahrzeug</LinkButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm hover:ring-gray-400 transition"
            >
              <div className="p-5 flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
                >
                  <Icon size={22} />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <h2 className="font-bold text-gray-900 mb-1">Aktivität</h2>
            <p className="text-sm text-gray-500 mb-4">Scans der letzten 7 Tage</p>
            <div className="text-4xl font-extrabold" style={{ color: 'var(--brand)' }}>
              {scans7d}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-bold text-gray-900 mb-3">Meistgescannte Fahrzeuge (30 Tage)</h2>
            {topVehicles.length === 0 ? (
              <p className="text-sm text-gray-500">Noch keine Scans erfasst.</p>
            ) : (
              <ul className="space-y-1">
                {topVehicles.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/admin/vehicles/${v.id}`}
                      className="flex items-center justify-between text-sm rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900">
                        {v.license_plate} {v.name ? <span className="text-gray-400">· {v.name}</span> : null}
                      </span>
                      <span className="font-bold text-gray-700">{v.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
