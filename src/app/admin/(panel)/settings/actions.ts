'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin, supabasePublicUrl } from '@/lib/supabase';
import { requireSession, requireAdmin } from '@/lib/guard';
import { hashPassword } from '@/lib/auth';
import { shortId } from '@/lib/ids';

export async function updateBranding(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();

  const patch: Record<string, unknown> = {
    app_name: String(formData.get('app_name') ?? '').trim() || 'Fuhrpark QR',
    primary_color: String(formData.get('primary_color') ?? '#e2001a'),
    accent_color: String(formData.get('accent_color') ?? '#222222'),
    qr_base_url: String(formData.get('qr_base_url') ?? '').trim() || null,
    label_headline: String(formData.get('label_headline') ?? '').trim(),
    label_subtext: String(formData.get('label_subtext') ?? '').trim(),
    updated_at: new Date().toISOString(),
  };

  const logo = formData.get('logo');
  if (logo instanceof File && logo.size > 0) {
    const ext = (logo.name.split('.').pop() || 'png').toLowerCase();
    const path = `logo-${shortId(6)}.${ext}`;
    const bytes = new Uint8Array(await logo.arrayBuffer());
    const { error } = await supabase.storage.from('branding').upload(path, bytes, {
      contentType: logo.type || 'image/png',
      upsert: true,
    });
    if (!error) patch.logo_url = supabasePublicUrl('branding', path);
  }
  if (formData.get('remove_logo') !== null) patch.logo_url = null;

  await supabase.from('settings').update(patch).eq('id', 1);
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  redirect('/admin/settings?saved=branding');
}

export async function updateOidc(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  await supabase
    .from('settings')
    .update({
      oidc_enabled: formData.get('oidc_enabled') !== null,
      oidc_issuer: String(formData.get('oidc_issuer') ?? '').trim() || null,
      oidc_client_id: String(formData.get('oidc_client_id') ?? '').trim() || null,
      oidc_client_secret: String(formData.get('oidc_client_secret') ?? '').trim() || null,
      oidc_scopes: String(formData.get('oidc_scopes') ?? 'openid email profile').trim() || 'openid email profile',
      oidc_button_label: String(formData.get('oidc_button_label') ?? '').trim() || 'Anmelden mit BRK.id',
      oidc_auto_create: formData.get('oidc_auto_create') !== null,
      oidc_allowed_domains: String(formData.get('oidc_allowed_domains') ?? '').trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=oidc&tab=sso');
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || password.length < 8) redirect('/admin/settings?error=user&tab=users');
  const { hash, salt } = hashPassword(password);
  const { error } = await supabase.from('admin_users').insert({
    email,
    name: String(formData.get('name') ?? '').trim(),
    role: String(formData.get('role') ?? 'editor') === 'admin' ? 'admin' : 'editor',
    password_hash: hash,
    password_salt: salt,
    provider: 'local',
  });
  if (error) redirect('/admin/settings?error=userexists&tab=users');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=user&tab=users');
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const id = String(formData.get('id') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!id || password.length < 8) redirect('/admin/settings?error=user&tab=users');
  const { hash, salt } = hashPassword(password);
  await supabase.from('admin_users').update({ password_hash: hash, password_salt: salt }).eq('id', id);
  redirect('/admin/settings?saved=user&tab=users');
}

export async function deleteUser(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (id && id !== me.id) {
    await getSupabaseAdmin().from('admin_users').delete().eq('id', id);
  }
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=user&tab=users');
}

export async function uploadIcon(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const file = formData.get('icon_file');
  if (!(file instanceof File) || file.size === 0) redirect('/admin/settings?error=icon&tab=icons');
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `icon-${shortId(8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from('icons').upload(path, bytes, {
    contentType: file.type || 'image/png',
    upsert: true,
  });
  if (error) redirect('/admin/settings?error=icon&tab=icons');
  await supabase.from('icons').insert({
    name: String(formData.get('icon_name') ?? '').trim() || file.name,
    storage_path: path,
  });
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=icon&tab=icons');
}

export async function deleteIcon(formData: FormData) {
  await requireSession();
  const supabase = getSupabaseAdmin();
  const id = String(formData.get('id') ?? '');
  const path = String(formData.get('path') ?? '');
  if (path) await supabase.storage.from('icons').remove([path]);
  if (id) await supabase.from('icons').delete().eq('id', id);
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=icon&tab=icons');
}
