'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { shortId } from '@/lib/ids';
import { defaultIconFor } from '@/lib/content';
import type { ContentType } from '@/lib/types';

const FILE_TYPES: ContentType[] = ['pdf', 'image'];

async function uploadContentFile(
  file: FormDataEntryValue | null,
  type: ContentType,
): Promise<{ path: string; mime: string } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  try {
    const supabase = getSupabaseAdmin();
    const fallbackMime = type === 'pdf' ? 'application/pdf' : 'application/octet-stream';
    const ext = (file.name.split('.').pop() || (type === 'pdf' ? 'pdf' : 'bin')).toLowerCase();
    const path = `${type}/${shortId(12)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabase.storage.from('content').upload(path, bytes, {
      contentType: file.type || fallbackMime,
      upsert: true,
    });
    if (error) {
      console.error('content upload failed:', error.message);
      return null;
    }
    return { path, mime: file.type || fallbackMime };
  } catch (err) {
    console.error('content upload threw:', err);
    return null;
  }
}

/** Build the type-specific payload columns from the submitted form. */
function payloadForType(type: ContentType, formData: FormData) {
  return {
    url: type === 'link' ? String(formData.get('url') ?? '').trim() : null,
    value: ['phone', 'email', 'address'].includes(type) ? String(formData.get('value') ?? '').trim() : null,
    body: type === 'text' ? String(formData.get('body') ?? '').trim() : null,
  };
}

export async function createLink(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const type = (String(formData.get('type') ?? 'link') || 'link') as ContentType;

  // Append new elements at the end of the current order.
  const { data: maxRow } = await supabase
    .from('links')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((maxRow as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  const row: Record<string, unknown> = {
    type,
    label: String(formData.get('label') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    icon: String(formData.get('icon') ?? defaultIconFor(type)),
    storage_path: null,
    mime: null,
    sort_order: nextOrder,
    ...payloadForType(type, formData),
  };

  if (FILE_TYPES.includes(type)) {
    const uploaded = await uploadContentFile(formData.get('file'), type);
    if (uploaded) {
      row.storage_path = uploaded.path;
      row.mime = uploaded.mime;
    }
  }

  const { data, error } = await supabase.from('links').insert(row).select('id').single();
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
  const type = (String(formData.get('type') ?? 'link') || 'link') as ContentType;

  const patch: Record<string, unknown> = {
    type,
    label: String(formData.get('label') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    icon: String(formData.get('icon') ?? defaultIconFor(type)),
    updated_at: new Date().toISOString(),
    ...payloadForType(type, formData),
  };

  if (FILE_TYPES.includes(type)) {
    const uploaded = await uploadContentFile(formData.get('file'), type);
    if (uploaded) {
      // Remove the previous file if a new one replaces it.
      const { data: old } = await supabase.from('links').select('storage_path').eq('id', id).maybeSingle();
      const oldPath = (old as { storage_path: string | null } | null)?.storage_path;
      if (oldPath && oldPath !== uploaded.path) await supabase.storage.from('content').remove([oldPath]);
      patch.storage_path = uploaded.path;
      patch.mime = uploaded.mime;
    }
    // else keep the existing file (storage_path/mime untouched).
  } else {
    // Switched to a non-file type: drop any stored file reference.
    const { data: old } = await supabase.from('links').select('storage_path').eq('id', id).maybeSingle();
    const oldPath = (old as { storage_path: string | null } | null)?.storage_path;
    if (oldPath) await supabase.storage.from('content').remove([oldPath]);
    patch.storage_path = null;
    patch.mime = null;
  }

  await supabase.from('links').update(patch).eq('id', id);

  await applyScopes(id, formData);
  revalidatePath('/admin/links');
  redirect('/admin/links?saved=1');
}

/**
 * Apply global + group + vehicle placements from the link form. The form sends
 * `scope_global` (checkbox), `group_ids` (multi-select) and `vehicle_ids`
 * (searchable multi-select). For each scope it fully replaces this link's
 * placements with the submitted selection.
 */
async function applyScopes(linkId: string, formData: FormData) {
  const supabase = getSupabaseAdmin();
  const wantGlobal = formData.get('scope_global') !== null;
  const groupIds = formData.getAll('group_ids').map(String).filter(Boolean);
  const vehicleIds = formData.getAll('vehicle_ids').map(String).filter(Boolean);

  // Replace all placements for this link with the submitted selection.
  await supabase.from('link_placements').delete().eq('link_id', linkId);

  const rows: Record<string, unknown>[] = [];
  if (wantGlobal) rows.push({ link_id: linkId, scope: 'global', position: 0, enabled: true });
  for (const gid of groupIds) {
    rows.push({ link_id: linkId, scope: 'group', group_id: gid, position: 0, enabled: true });
  }
  for (const vid of vehicleIds) {
    rows.push({ link_id: linkId, scope: 'vehicle', vehicle_id: vid, position: 0, enabled: true });
  }
  if (rows.length) await supabase.from('link_placements').insert(rows);
}

export async function deleteLink(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const id = String(formData.get('id') ?? '');
  if (id) {
    const { data } = await supabase.from('links').select('storage_path').eq('id', id).maybeSingle();
    const path = (data as { storage_path: string | null } | null)?.storage_path;
    if (path) await supabase.storage.from('content').remove([path]);
    await supabase.from('links').delete().eq('id', id);
  }
  revalidatePath('/admin/links');
  redirect('/admin/links?deleted=1');
}

/** Move a content element up or down in the global display order. */
export async function moveLink(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const id = String(formData.get('id') ?? '');
  const dir = String(formData.get('dir') ?? '');
  if (!id || (dir !== 'up' && dir !== 'down')) redirect('/admin/links');

  const { data } = await supabase.from('links').select('id, sort_order').order('sort_order').order('created_at');
  const list = (data as { id: string; sort_order: number }[]) ?? [];
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) redirect('/admin/links');

  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) redirect('/admin/links'); // already at the edge

  const a = list[idx];
  const b = list[swapIdx];
  // Swap their order values (use distinct values in case of ties).
  await supabase.from('links').update({ sort_order: b.sort_order }).eq('id', a.id);
  await supabase.from('links').update({ sort_order: a.sort_order }).eq('id', b.id);
  if (a.sort_order === b.sort_order) {
    // Tie-break: nudge one so the order is deterministic next time.
    await supabase.from('links').update({ sort_order: a.sort_order + (dir === 'up' ? -1 : 1) }).eq('id', a.id);
  }

  revalidatePath('/admin/links');
  redirect('/admin/links');
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
