import { getSupabaseAdmin } from '@/lib/supabase';
import { Button, Card, CardBody, Field, Input, LinkButton, PageHeader, Select, Textarea } from '@/components/ui';
import { createVehicle } from '../actions';
import type { Group } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function NewVehiclePage() {
  const { data: groups } = await getSupabaseAdmin().from('groups').select('*').order('name');
  const groupList = (groups as Group[]) ?? [];

  return (
    <div>
      <PageHeader title="Neues Fahrzeug" subtitle="Ein eindeutiger QR-Code wird automatisch erzeugt." />
      <Card className="max-w-2xl">
        <CardBody className="p-6">
          <form action={createVehicle} className="space-y-4">
            <Field label="KFZ-Kennzeichen" hint="Wird auf der Landingpage und dem Etikett angezeigt.">
              <Input name="license_plate" required placeholder="AB-RK 1234" />
            </Field>
            <Field label="Name / Bezeichnung (optional)">
              <Input name="name" placeholder="z. B. VW T6 Mannschaftswagen" />
            </Field>
            <Field label="Gruppe">
              <Select name="group_id" defaultValue="">
                <option value="">— keine Gruppe —</option>
                {groupList.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fahrgestellnummer (FIN/VIN, optional)">
              <Input name="vin" />
            </Field>
            <Field label="Etikett-Überschrift (optional)" hint="Überschreibt die Standard-Überschrift auf dem Etikett nur für dieses Fahrzeug.">
              <Input name="label_headline" placeholder="z. B. Fahrzeug-Administration" />
            </Field>
            <Field label="Notizen (optional)">
              <Textarea name="notes" rows={3} />
            </Field>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
              <span className="text-sm text-gray-700">Aktiv</span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button type="submit">Anlegen</Button>
              <LinkButton href="/admin/vehicles" variant="ghost">Abbrechen</LinkButton>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
