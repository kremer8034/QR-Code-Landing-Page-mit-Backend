import { getSupabaseAdmin, supabasePublicUrl } from '@/lib/supabase';
import { Alert, Button, Card, CardBody, Field, Input, PageHeader, Textarea } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { IconPicker } from '@/components/IconPicker';
import { ICON_TEMPLATES } from '@/lib/icons';
import { VehiclePicker } from '@/components/VehiclePicker';
import { createLink, updateLink, deleteLink } from './actions';
import type { Group, IconItem, LinkItem, LinkPlacement, Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const sp = await searchParams;
  const supabase = getSupabaseAdmin();

  const [{ data: links }, { data: groups }, { data: placements }, { data: icons }, { data: vehicles }] =
    await Promise.all([
      supabase.from('links').select('*').order('label'),
      supabase.from('groups').select('*').order('name'),
      supabase.from('link_placements').select('*'),
      supabase.from('icons').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('id, license_plate, name, group_id').order('license_plate'),
    ]);

  const linkList = (links as LinkItem[]) ?? [];
  const groupList = (groups as Group[]) ?? [];
  const groupNameMap = new Map(groupList.map((g) => [g.id, g.name]));
  const allPlacements = (placements as LinkPlacement[]) ?? [];
  const customIcons = ((icons as IconItem[]) ?? []).map((i) => ({
    value: i.storage_path,
    url: supabasePublicUrl('icons', i.storage_path),
    name: i.name,
  }));

  const vehicleOptions = ((vehicles as Pick<Vehicle, 'id' | 'license_plate' | 'name' | 'group_id'>[]) ?? []).map((v) => ({
    id: v.id,
    label: v.license_plate || '(ohne Kennzeichen)',
    sub: [v.name, v.group_id ? groupNameMap.get(v.group_id) : null].filter(Boolean).join(' · '),
  }));

  const isGlobal = (linkId: string) => allPlacements.some((p) => p.link_id === linkId && p.scope === 'global');
  const linkGroups = (linkId: string) =>
    new Set(allPlacements.filter((p) => p.link_id === linkId && p.scope === 'group').map((p) => p.group_id));
  const linkVehicles = (linkId: string) =>
    allPlacements.filter((p) => p.link_id === linkId && p.scope === 'vehicle' && p.vehicle_id).map((p) => p.vehicle_id as string);

  function GroupChecks({ selected }: { selected: Set<string | null> }) {
    if (groupList.length === 0) return <p className="text-xs text-gray-400">Keine Gruppen vorhanden.</p>;
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {groupList.map((g) => (
          <label key={g.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="group_ids" value={g.id} defaultChecked={selected.has(g.id)} className="h-4 w-4" />
            <span className="truncate">{g.name}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Links"
        subtitle="Zentrale Link-Bibliothek. Eine Änderung wirkt sofort auf allen zugeordneten Landingpages."
      />

      {sp.saved ? <div className="mb-4"><Alert kind="success">Gespeichert.</Alert></div> : null}
      {sp.deleted ? <div className="mb-4"><Alert kind="success">Link gelöscht.</Alert></div> : null}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* New link */}
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Neuer Link</h2>
            <form action={createLink} className="space-y-4">
              <Field label="Bezeichnung">
                <Input name="label" required placeholder="z. B. Digitaler Fahrzeugcheck" />
              </Field>
              <Field label="URL">
                <Input name="url" type="url" required placeholder="https://…" />
              </Field>
              <Field label="Beschreibung (optional)">
                <Input name="description" placeholder="Kurztext unter dem Button" />
              </Field>
              <Field label="Symbol">
                <IconPicker name="icon" templates={ICON_TEMPLATES} customIcons={customIcons} />
              </Field>
              <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3 space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name="scope_global" className="h-4 w-4" />
                  Auf <strong>allen</strong> Landingpages anzeigen
                </label>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Für Gruppen</div>
                  <GroupChecks selected={new Set()} />
                </div>
                <VehiclePicker name="vehicle_ids" vehicles={vehicleOptions} selected={[]} />
              </div>
              <Button type="submit">Link anlegen</Button>
            </form>
          </CardBody>
        </Card>

        {/* Existing links */}
        <div className="lg:col-span-2 space-y-3">
          {linkList.length === 0 ? (
            <Card><CardBody><p className="text-gray-500 text-center py-6">Noch keine Links.</p></CardBody></Card>
          ) : (
            linkList.map((l) => (
              <Card key={l.id}>
                <CardBody className="p-5">
                  <details>
                    <summary className="flex items-center gap-3 cursor-pointer list-none">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}>
                        <Icon icon={l.icon} size={20} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 block">{l.label}</span>
                        <span className="text-xs text-gray-400 truncate block">{l.url}</span>
                      </span>
                      <span className="flex gap-1">
                        {isGlobal(l.id) ? <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">global</span> : null}
                        {linkGroups(l.id).size > 0 ? <span className="text-xs rounded-full bg-blue-100 text-blue-700 px-2 py-0.5">{linkGroups(l.id).size} Gruppe(n)</span> : null}
                        {linkVehicles(l.id).length > 0 ? <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">{linkVehicles(l.id).length} Fahrzeug(e)</span> : null}
                      </span>
                    </summary>

                    <form action={updateLink} className="space-y-4 mt-4 pt-4 border-t border-gray-100">
                      <input type="hidden" name="id" value={l.id} />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Bezeichnung"><Input name="label" defaultValue={l.label} required /></Field>
                        <Field label="URL"><Input name="url" type="url" defaultValue={l.url} required /></Field>
                      </div>
                      <Field label="Beschreibung"><Input name="description" defaultValue={l.description} /></Field>
                      <Field label="Symbol">
                        <IconPicker name="icon" defaultValue={l.icon} templates={ICON_TEMPLATES} customIcons={customIcons} />
                      </Field>
                      <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3 space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input type="checkbox" name="scope_global" defaultChecked={isGlobal(l.id)} className="h-4 w-4" />
                          Auf <strong>allen</strong> Landingpages anzeigen
                        </label>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Für Gruppen</div>
                          <GroupChecks selected={linkGroups(l.id)} />
                        </div>
                        <VehiclePicker name="vehicle_ids" vehicles={vehicleOptions} selected={linkVehicles(l.id)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Button type="submit" variant="ghost">Speichern</Button>
                      </div>
                    </form>

                    <form action={deleteLink} className="mt-2">
                      <input type="hidden" name="id" value={l.id} />
                      <button className="text-sm text-red-600 hover:underline">Link löschen</button>
                    </form>
                  </details>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
