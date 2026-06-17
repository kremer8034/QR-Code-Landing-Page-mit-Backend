'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';

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
