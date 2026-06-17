import { getSupabaseAdmin } from '@/lib/supabase';
import { Button, Card, CardBody, Field, Input, PageHeader, Textarea } from '@/components/ui';
import { createGroup, updateGroup, deleteGroup } from './actions';
import type { Group } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('groups').select('*').order('name');
  const groups = (data as Group[]) ?? [];

  // Count vehicles per group.
  const { data: vehicleGroups } = await supabase.from('vehicles').select('group_id');
  const counts = new Map<string, number>();
  for (const v of (vehicleGroups as { group_id: string | null }[]) ?? []) {
    if (v.group_id) counts.set(v.group_id, (counts.get(v.group_id) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader title="Gruppen" subtitle="Fahrzeuge in Gruppen organisieren (z. B. Fahrzeug- und Servicedienste)" />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Neue Gruppe</h2>
            <form action={createGroup} className="space-y-4">
              <Field label="Name">
                <Input name="name" required placeholder="z. B. Fahrzeug- und Servicedienste" />
              </Field>
              <Field label="Farbe">
                <input type="color" name="color" defaultValue="#e2001a" className="h-10 w-20 rounded-lg ring-1 ring-gray-300" />
              </Field>
              <Field label="Beschreibung">
                <Textarea name="description" rows={2} />
              </Field>
              <Button type="submit">Anlegen</Button>
            </form>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-3">
          {groups.length === 0 ? (
            <Card><CardBody><p className="text-gray-500 text-center py-6">Noch keine Gruppen.</p></CardBody></Card>
          ) : (
            groups.map((g) => (
              <Card key={g.id}>
                <CardBody className="p-5">
                  <form action={updateGroup} className="space-y-3">
                    <input type="hidden" name="id" value={g.id} />
                    <div className="flex items-center gap-3">
                      <input type="color" name="color" defaultValue={g.color} className="h-9 w-12 rounded-lg ring-1 ring-gray-300" />
                      <Input name="name" defaultValue={g.name} className="flex-1" />
                      <span className="text-sm text-gray-400 whitespace-nowrap">{counts.get(g.id) ?? 0} Fahrz.</span>
                    </div>
                    <Textarea name="description" rows={2} defaultValue={g.description} placeholder="Beschreibung" />
                    <div className="flex gap-2">
                      <Button type="submit" variant="ghost">Speichern</Button>
                    </div>
                  </form>
                  <form action={deleteGroup} className="mt-2">
                    <input type="hidden" name="id" value={g.id} />
                    <button className="text-sm text-red-600 hover:underline">Gruppe löschen</button>
                  </form>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
