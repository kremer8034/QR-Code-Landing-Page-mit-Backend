import { getSupabaseAdmin, supabasePublicUrl } from '@/lib/supabase';
import { Alert, Card, CardBody, PageHeader } from '@/components/ui';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Icon } from '@/components/Icon';
import { LinkForm } from '@/components/LinkForm';
import { ICON_TEMPLATES } from '@/lib/icons';
import { contentPreview, contentTypeMeta } from '@/lib/content';
import { createLink, updateLink, deleteLink, moveLink } from './actions';
import type { Group, IconItem, LinkItem, LinkPlacement, Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = getSupabaseAdmin();

  const [{ data: links }, { data: groups }, { data: placements }, { data: icons }, { data: vehicles }] =
    await Promise.all([
      supabase.from('links').select('*').order('sort_order').order('created_at'),
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

  const groupOptions = groupList.map((g) => ({ id: g.id, name: g.name }));

  const isGlobal = (linkId: string) => allPlacements.some((p) => p.link_id === linkId && p.scope === 'global');
  const linkGroups = (linkId: string) =>
    allPlacements.filter((p) => p.link_id === linkId && p.scope === 'group' && p.group_id).map((p) => p.group_id as string);
  const linkVehicles = (linkId: string) =>
    allPlacements.filter((p) => p.link_id === linkId && p.scope === 'vehicle' && p.vehicle_id).map((p) => p.vehicle_id as string);

  return (
    <div>
      <PageHeader
        title="Inhalte & Links"
        subtitle="Zentrale Bibliothek. Die Pfeile legen die Standard-Reihenfolge fest; pro Gruppe lässt sich die Reihenfolge unter „Gruppen“ separat einstellen."
      />

      {sp.saved ? <div className="mb-4"><Alert kind="success">Gespeichert.</Alert></div> : null}
      {sp.deleted ? <div className="mb-4"><Alert kind="success">Element gelöscht.</Alert></div> : null}
      {sp.error === 'create' ? <div className="mb-4"><Alert kind="error">Konnte nicht gespeichert werden. Bitte Eingaben/Datei prüfen.</Alert></div> : null}
      {sp.error === 'url' ? <div className="mb-4"><Alert kind="error">Bitte eine gültige Web-Adresse angeben (http:// oder https://).</Alert></div> : null}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* New element */}
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Neues Element</h2>
            <LinkForm
              action={createLink}
              submitLabel="Element anlegen"
              templates={ICON_TEMPLATES}
              customIcons={customIcons}
              groups={groupOptions}
              vehicles={vehicleOptions}
              selectedGroups={[]}
              selectedVehicles={[]}
              isGlobal={false}
            />
          </CardBody>
        </Card>

        {/* Existing elements */}
        <div className="lg:col-span-2 space-y-3">
          {linkList.length === 0 ? (
            <Card><CardBody><p className="text-gray-500 text-center py-6">Noch keine Inhalte.</p></CardBody></Card>
          ) : (
            linkList.map((l, i) => (
              <Card key={l.id}>
                <CardBody className="p-5">
                  <div className="flex gap-3">
                  <div className="flex flex-col gap-0.5 shrink-0 pt-1">
                    <form action={moveLink}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button type="submit" title="Nach oben" disabled={i === 0} className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-20">
                        <ChevronUp size={16} />
                      </button>
                    </form>
                    <form action={moveLink}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button type="submit" title="Nach unten" disabled={i === linkList.length - 1} className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-20">
                        <ChevronDown size={16} />
                      </button>
                    </form>
                  </div>
                  <details className="flex-1 min-w-0">
                    <summary className="flex items-center gap-3 cursor-pointer list-none">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}>
                        <Icon icon={l.icon} size={20} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 block truncate">{l.label || contentTypeMeta(l.type).label}</span>
                        <span className="text-xs text-gray-400 truncate block">{contentPreview(l)}</span>
                      </span>
                      <span className="flex flex-wrap gap-1 justify-end shrink-0">
                        <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">{contentTypeMeta(l.type).label}</span>
                        {isGlobal(l.id) ? <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">global</span> : null}
                        {linkGroups(l.id).length > 0 ? <span className="text-xs rounded-full bg-blue-100 text-blue-700 px-2 py-0.5">{linkGroups(l.id).length} Gruppe(n)</span> : null}
                        {linkVehicles(l.id).length > 0 ? <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">{linkVehicles(l.id).length} Fahrzeug(e)</span> : null}
                      </span>
                    </summary>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <LinkForm
                        action={updateLink}
                        submitLabel="Speichern"
                        templates={ICON_TEMPLATES}
                        customIcons={customIcons}
                        groups={groupOptions}
                        vehicles={vehicleOptions}
                        initial={{
                          id: l.id,
                          type: l.type,
                          label: l.label,
                          description: l.description,
                          url: l.url ?? '',
                          value: l.value ?? '',
                          body: l.body ?? '',
                          icon: l.icon,
                          hasFile: Boolean(l.storage_path),
                        }}
                        selectedGroups={linkGroups(l.id)}
                        selectedVehicles={linkVehicles(l.id)}
                        isGlobal={isGlobal(l.id)}
                      />
                    </div>

                    <form action={deleteLink} className="mt-2">
                      <input type="hidden" name="id" value={l.id} />
                      <button className="text-sm text-red-600 hover:underline">Element löschen</button>
                    </form>
                  </details>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
