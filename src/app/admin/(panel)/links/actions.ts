'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';

export async function createLink(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('links')
    .insert({
      label: String(formData.get('label') ?? '').trim(),
      url: String(formData.get('url') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      icon: String(formData.get('icon') ?? 'lucide:Link'),
    })
    .select('id')
    .single();
  if (error || !data) redirect('/admin/links?error=create');

  await applyScopes(data.id, formData);
  revalidatePath('/admin/links');
  redirect('/admin/links?saved=1');
}

export async function updateLink(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/links');

  await supabase
    .from('links')
    .update({
      label: String(formData.get('label') ?? '').trim(),
      url: String(formData.get('url') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      icon: String(formData.get('icon') ?? 'lucide:Link'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  await applyScopes(id, formData);
  revalidatePath('/admin/links');
  redirect('/admin/links?saved=1');
}

/**
 * Apply global + group placements from the link form. The form sends
 * `scope_global` (checkbox) and `group_ids` (multi-select). Vehicle-scoped
 * placements are managed separately on the vehicle page and left untouched.
 */
async function applyScopes(linkId: string, formData: FormData) {
  const supabase = getSupabaseAdmin();
  const wantGlobal = formData.get('scope_global') !== null;
  const groupIds = formData.getAll('group_ids').map(String).filter(Boolean);

  // Replace global + group placements for this link.
  await supabase.from('link_placements').delete().eq('link_id', linkId).in('scope', ['global', 'group']);

  const rows: any[] = [];
  if (wantGlobal) rows.push({ link_id: linkId, scope: 'global', position: 0, enabled: true });
  for (const gid of groupIds) {
    rows.push({ link_id: linkId, scope: 'group', group_id: gid, position: 0, enabled: true });
  }
  if (rows.length) await supabase.from('link_placements').insert(rows);
}

export async function deleteLink(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  if (id) await getSupabaseAdmin().from('links').delete().eq('id', id);
  revalidatePath('/admin/links');
  redirect('/admin/links?deleted=1');
}

/** Set the vehicle-scoped link placements for a single vehicle. */
export async function setVehiclePlacements(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const vehicleId = String(formData.get('vehicle_id') ?? '');
  if (!vehicleId) redirect('/admin/vehicles');
  const linkIds = formData.getAll('link_ids').map(String).filter(Boolean);

  await supabase.from('link_placements').delete().eq('vehicle_id', vehicleId).eq('scope', 'vehicle');
  if (linkIds.length) {
    await supabase.from('link_placements').insert(
      linkIds.map((lid, i) => ({ link_id: lid, scope: 'vehicle', vehicle_id: vehicleId, position: i, enabled: true })),
    );
  }
  revalidatePath(`/admin/vehicles/${vehicleId}`);
  redirect(`/admin/vehicles/${vehicleId}?links=1`);
}
