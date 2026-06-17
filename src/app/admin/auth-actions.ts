'use server';

import { redirect } from 'next/navigation';
import { authenticate, countAdminUsers, createSession, destroySession, hashPassword } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const user = await authenticate(email, password);
  if (!user) {
    redirect('/admin/login?error=invalid');
  }
  await createSession(user);
  redirect('/admin');
}

export async function setupAction(formData: FormData) {
  const existing = await countAdminUsers();
  if (existing > 0) {
    redirect('/admin/login');
  }

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || password.length < 8) {
    redirect('/admin/setup?error=weak');
  }

  const { hash, salt } = hashPassword(password);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('admin_users')
    .insert({ name, email, role: 'admin', password_hash: hash, password_salt: salt, provider: 'local' })
    .select('id, email, name, role')
    .single();

  if (error || !data) {
    redirect('/admin/setup?error=failed');
  }

  await createSession({ id: data.id, email: data.email, name: data.name, role: data.role });
  redirect('/admin');
}

export async function logoutAction() {
  await destroySession();
  redirect('/admin/login');
}
