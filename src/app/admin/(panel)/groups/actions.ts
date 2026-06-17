'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { isUuid } from '@/lib/validate';

/** Build the ordered list of content elements shown for a group (global + group). */
async function groupOrderedLinkIds(groupId: string): Promise<string[]> {
  if (!isUuid(groupId)) return [];
  const supabase = getSupabaseAdmin();
  const { data: placements } = await supabase
    .from('link_placements')
    .select('link_id')
    .eq('enabled', true)
    .or(`scope.eq.global,group_id.eq.${groupId}`);
  const linkIds = Array.from(new Set(((placements as { link_id: string }[]) ?? []).map((p) => p.link_id)));
  if (linkIds.length === 0) return [];

  const { data: links } = await supabase.from('links').select('id, label, sort_order').in('id', linkIds);
  const arr = (links as { id: string; label: string; sort_order: number }[]) ?? [];

  const { data: existing } = await supabase
    .from('group_link_order')
    .select('link_id, position')
    .eq('group_id', groupId);
  const posMap = new Map(((existing as { link_id: string; position: number }[]) ?? []).map((o) => [o.link_id, o.position]));

  arr.sort((a, b) => {
    const pa = posMap.get(a.id);
    const pb = posMap.get(b.id);
    if (pa != null && pb != null && pa !== pb) return pa - pb;
    if (pa != null && pb == null) return -1;
    if (pa == null && pb != null) return 1;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.label.localeCompare(b.label, 'de');
  });
  return arr.map((l) => l.id);
}

/** Move a content element up/down within a single group's display order. */
export async function moveGroupLink(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const groupId = String(formData.get('group_id') ?? '');
  const linkId = String(formData.get('link_id') ?? '');
  const dir = String(formData.get('dir') ?? '');
  if (!isUuid(groupId) || !isUuid(linkId) || (dir !== 'up' && dir !== 'down')) redirect('/admin/groups');

  const ordered = await groupOrderedLinkIds(groupId);
  const idx = ordered.indexOf(linkId);
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) redirect(`/admin/groups/${groupId}/order`);

  [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];

  // Persist sequential positions for the whole current list of the group.
  const rows = ordered.map((id, i) => ({ group_id: groupId, link_id: id, position: i + 1 }));
  await supabase.from('group_link_order').upsert(rows, { onConflict: 'group_id,link_id' });

  revalidatePath(`/admin/groups/${groupId}/order`);
  redirect(`/admin/groups/${groupId}/order`);
}

export async function createGroup(formData: FormData) {
  await requireSession();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/admin/groups?error=name');
  await getSupabaseAdmin().from('groups').insert({
    name,
    description: String(formData.get('description') ?? '').trim(),
    color: String(formData.get('color') ?? '#888888'),
  });
  revalidatePath('/admin/groups');
  redirect('/admin/groups?saved=1');
}

export async function updateGroup(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/groups');
  await getSupabaseAdmin().from('groups').update({
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    color: String(formData.get('color') ?? '#888888'),
  }).eq('id', id);
  revalidatePath('/admin/groups');
  redirect('/admin/groups?saved=1');
}

export async function deleteGroup(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  if (id) await getSupabaseAdmin().from('groups').delete().eq('id', id);
  revalidatePath('/admin/groups');
  redirect('/admin/groups?deleted=1');
}
