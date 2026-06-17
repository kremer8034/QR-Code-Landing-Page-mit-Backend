import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSettings, resolveBaseUrl } from '@/lib/settings';
import { vehicleUrl } from '@/lib/qr';
import {
  Alert, Button, Card, CardBody, Field, Input, LinkButton, PageHeader, Select, Textarea,
} from '@/components/ui';
import { Icon } from '@/components/Icon';
import { CopyField } from '@/components/CopyField';
import { Download, ExternalLink, ImageIcon, Printer } from 'lucide-react';
import { updateVehicle, deleteVehicle } from '../actions';
import { setVehiclePlacements } from '../../links/actions';
import type { Group, LinkItem, LinkPlacement, Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function VehicleEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string; links?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = getSupabaseAdmin();

  const { data: vehicleData } = await supabase.from('vehicles').select('*').eq('id', id).maybeSingle();
  const vehicle = vehicleData as Vehicle | null;
  if (!vehicle) notFound();

  const [{ data: groups }, { data: links }, { data: placements }, { count: scanCount }] = await Promise.all([
    supabase.from('groups').select('*').order('name'),
    supabase.from('links').select('*').order('label'),
    supabase.from('link_placements').select('*'),
    supabase.from('scans').select('id', { count: 'exact', head: true }).eq('vehicle_id', id),
  ]);

  const groupList = (groups as Group[]) ?? [];
  const linkList = (links as LinkItem[]) ?? [];
  const linkMap = new Map(linkList.map((l) => [l.id, l]));
  const allPlacements = (placements as LinkPlacement[]) ?? [];

  const vehicleLinkIds = new Set(
    allPlacements.filter((p) => p.scope === 'vehicle' && p.vehicle_id === id).map((p) => p.link_id),
  );
  const inheritedGlobal = allPlacements.filter((p) => p.scope === 'global');
  const inheritedGroup = vehicle.group_id
    ? allPlacements.filter((p) => p.scope === 'group' && p.group_id === vehicle.group_id)
    : [];

  const settings = await getSettings();
  // Build the absolute landing-page URL. Prefer the configured QR base URL;
  // otherwise fall back to the current request host so we always show a full,
  // copyable URL (never just the relative /v/<id> path).
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const requestOrigin = host ? `${proto}://${host}` : null;
  const baseUrl = resolveBaseUrl(settings, requestOrigin);
  const target = vehicleUrl(baseUrl || '', vehicle.public_id);

  return (
    <div>
      <PageHeader
        title={vehicle.license_plate || 'Fahrzeug'}
        subtitle={vehicle.name}
        action={<LinkButton href="/admin/vehicles" variant="ghost">Zurück</LinkButton>}
      />

      {sp.created ? <div className="mb-4"><Alert kind="success">Fahrzeug angelegt. QR-Code ist bereit.</Alert></div> : null}
      {sp.saved ? <div className="mb-4"><Alert kind="success">Änderungen gespeichert.</Alert></div> : null}
      {sp.links ? <div className="mb-4"><Alert kind="success">Links für dieses Fahrzeug gespeichert.</Alert></div> : null}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: edit form + links */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="p-6">
              <h2 className="font-bold text-gray-900 mb-4">Stammdaten</h2>
              <form action={updateVehicle} className="space-y-4">
                <input type="hidden" name="id" value={vehicle.id} />
                <Field label="KFZ-Kennzeichen">
                  <Input name="license_plate" defaultValue={vehicle.license_plate} required />
                </Field>
                <Field label="Name / Bezeichnung">
                  <Input name="name" defaultValue={vehicle.name} />
                </Field>
                <Field label="Gruppe">
                  <Select name="group_id" defaultValue={vehicle.group_id ?? ''}>
                    <option value="">— keine Gruppe —</option>
                    {groupList.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </Select>
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="FIN/VIN">
                    <Input name="vin" defaultValue={vehicle.vin} />
                  </Field>
                  <Field label="Etikett-Überschrift">
                    <Input name="label_headline" defaultValue={vehicle.label_headline ?? ''} placeholder={settings.label_headline} />
                  </Field>
                </div>
                <Field label="Notizen">
                  <Textarea name="notes" rows={2} defaultValue={vehicle.notes} />
                </Field>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="active" defaultChecked={vehicle.active} className="h-4 w-4" />
                  <span className="text-sm text-gray-700">Aktiv</span>
                </label>
                <Button type="submit">Speichern</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h2 className="font-bold text-gray-900 mb-1">Links auf dieser Landingpage</h2>
              <p className="text-sm text-gray-500 mb-4">
                Wählen Sie zusätzliche Links speziell für dieses Fahrzeug. Globale und Gruppen-Links erscheinen
                automatisch.
              </p>

              {(inheritedGlobal.length > 0 || inheritedGroup.length > 0) ? (
                <div className="mb-4 rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Automatisch (vererbt)</div>
                  <ul className="space-y-1">
                    {[...inheritedGlobal, ...inheritedGroup].map((p) => {
                      const l = linkMap.get(p.link_id);
                      if (!l) return null;
                      return (
                        <li key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <Icon icon={l.icon} size={16} />
                          {l.label}
                          <span className="text-xs text-gray-400">
                            ({p.scope === 'global' ? 'global' : 'Gruppe'})
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {linkList.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Noch keine Links in der Bibliothek.{' '}
                  <LinkButton href="/admin/links" variant="ghost">Links anlegen</LinkButton>
                </p>
              ) : (
                <form action={setVehiclePlacements} className="space-y-3">
                  <input type="hidden" name="vehicle_id" value={vehicle.id} />
                  <div className="space-y-2">
                    {linkList.map((l) => (
                      <label key={l.id} className="flex items-center gap-3 rounded-xl ring-1 ring-gray-200 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          name="link_ids"
                          value={l.id}
                          defaultChecked={vehicleLinkIds.has(l.id)}
                          className="h-4 w-4"
                        />
                        <Icon icon={l.icon} size={18} />
                        <span className="flex-1">
                          <span className="font-medium text-gray-900">{l.label}</span>
                          <span className="block text-xs text-gray-400 truncate">{l.url}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button type="submit">Link-Zuordnung speichern</Button>
                </form>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: QR + downloads + stats */}
        <div className="space-y-6">
          <Card>
            <CardBody className="p-6 text-center">
              <h2 className="font-bold text-gray-900 mb-3">QR-Code</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/${vehicle.public_id}?scale=8`}
                alt="QR-Code"
                className="mx-auto w-44 h-44 ring-1 ring-gray-200 rounded-xl"
              />
              <div className="mt-4 text-left">
                <CopyField label="Landingpage-Link (zum Kopieren)" value={target || `/v/${vehicle.public_id}`} />
                <a
                  href={target || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <ExternalLink size={12} /> Seite in neuem Tab öffnen
                </a>
              </div>

              <div className="mt-4 grid gap-2">
                <a href={`/api/qr/${vehicle.public_id}?download=1`} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold btn-brand">
                  <ImageIcon size={16} /> QR als PNG
                </a>
                <a href={`/api/qr/${vehicle.public_id}?format=svg&download=1`} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200">
                  <Download size={16} /> QR als SVG
                </a>
                <a href={`/api/labels?ids=${vehicle.id}`} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold bg-gray-900 text-white hover:bg-gray-700">
                  <Printer size={16} /> Etikett-PDF (DK-11209)
                </a>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h2 className="font-bold text-gray-900 mb-1">Statistik</h2>
              <div className="text-3xl font-extrabold" style={{ color: 'var(--brand)' }}>{scanCount ?? 0}</div>
              <div className="text-sm text-gray-500">Scans gesamt</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h2 className="font-bold text-gray-900 mb-3">Gefahrenzone</h2>
              <form action={deleteVehicle}>
                <input type="hidden" name="id" value={vehicle.id} />
                <Button type="submit" variant="danger" className="w-full">Fahrzeug löschen</Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
