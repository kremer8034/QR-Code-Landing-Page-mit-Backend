'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { shortId } from '@/lib/ids';

async function uniquePublicId(): Promise<string> {
  const supabase = getSupabaseAdmin();
  for (let i = 0; i < 8; i++) {
    const id = shortId(8);
    const { data } = await supabase.from('vehicles').select('id').eq('public_id', id).maybeSingle();
    if (!data) return id;
  }
  return shortId(12);
}

export async function createVehicle(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const public_id = await uniquePublicId();

  const groupId = String(formData.get('group_id') ?? '');
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      public_id,
      license_plate: String(formData.get('license_plate') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      vin: String(formData.get('vin') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      label_headline: (String(formData.get('label_headline') ?? '').trim() || null),
      group_id: groupId || null,
      active: formData.get('active') !== null,
    })
    .select('id')
    .single();

  if (error || !data) redirect('/admin/vehicles?error=create');
  revalidatePath('/admin/vehicles');
  redirect(`/admin/vehicles/${data.id}?created=1`);
}

export async function updateVehicle(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/vehicles');

  const groupId = String(formData.get('group_id') ?? '');
  await supabase
    .from('vehicles')
    .update({
      license_plate: String(formData.get('license_plate') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      vin: String(formData.get('vin') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      label_headline: (String(formData.get('label_headline') ?? '').trim() || null),
      group_id: groupId || null,
      active: formData.get('active') !== null,
    })
    .eq('id', id);

  revalidatePath('/admin/vehicles');
  revalidatePath(`/admin/vehicles/${id}`);
  redirect(`/admin/vehicles/${id}?saved=1`);
}

export async function deleteVehicle(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const id = String(formData.get('id') ?? '');
  if (id) await supabase.from('vehicles').delete().eq('id', id);
  revalidatePath('/admin/vehicles');
  redirect('/admin/vehicles?deleted=1');
}

function pick(row: Record<string, any>, keys: string[]): string {
  for (const k of Object.keys(row)) {
    const norm = k.toString().trim().toLowerCase();
    if (keys.includes(norm)) return String(row[k] ?? '').trim();
  }
  return '';
}

/**
 * Bulk import vehicles from an uploaded Excel/CSV file. Recognised column
 * headers (case-insensitive): Kennzeichen/license_plate, Name/Bezeichnung,
 * Gruppe/group, VIN/FIN, Notiz/notes.
 */
export async function importVehicles(formData: FormData) {
  await requireSession();
  const file = formData.get('file');
  if (!(file instanceof File)) redirect('/admin/vehicles/import?error=nofile');

  const buf = Buffer.from(await (file as File).arrayBuffer());
  let rows: Record<string, any>[] = [];
  try {
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } catch {
    redirect('/admin/vehicles/import?error=parse');
  }

  const supabase = getSupabaseAdmin();

  // Map group names -> ids, creating missing groups.
  const { data: existingGroups } = await supabase.from('groups').select('id, name');
  const groupMap = new Map<string, string>(
    (existingGroups as { id: string; name: string }[] ?? []).map((g) => [g.name.toLowerCase(), g.id]),
  );

  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    const plate = pick(row, ['kennzeichen', 'license_plate', 'kfz-kennzeichen', 'kfz', 'plate']);
    const name = pick(row, ['name', 'bezeichnung', 'fahrzeug', 'modell']);
    if (!plate && !name) {
      skipped++;
      continue;
    }
    const groupName = pick(row, ['gruppe', 'group', 'abteilung']);
    let groupId: string | null = null;
    if (groupName) {
      const key = groupName.toLowerCase();
      if (groupMap.has(key)) {
        groupId = groupMap.get(key)!;
      } else {
        const { data: ng } = await supabase.from('groups').insert({ name: groupName }).select('id').single();
        if (ng) {
          groupId = ng.id;
          groupMap.set(key, ng.id);
        }
      }
    }

    const public_id = await uniquePublicId();
    const { error } = await supabase.from('vehicles').insert({
      public_id,
      license_plate: plate,
      name,
      vin: pick(row, ['vin', 'fin', 'fahrgestellnummer']),
      notes: pick(row, ['notiz', 'notes', 'bemerkung', 'kommentar']),
      group_id: groupId,
    });
    if (error) skipped++;
    else created++;
  }

  revalidatePath('/admin/vehicles');
  redirect(`/admin/vehicles?imported=${created}&skipped=${skipped}`);
}
