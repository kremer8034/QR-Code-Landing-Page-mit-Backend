import { redirect } from 'next/navigation';
import { getSession, countAdminUsers } from './auth';
import { isSupabaseConfigured } from './supabase';
import type { SessionUser } from './types';

/**
 * Guard for backoffice pages. Redirects to setup (if no users yet) or login.
 * Returns the authenticated session user when access is allowed.
 */
export async function requireSession(): Promise<SessionUser> {
  if (!isSupabaseConfigured()) {
    redirect('/admin/login?error=config');
  }
  const session = await getSession();
  if (!session) {
    let users = 0;
    try {
      users = await countAdminUsers();
    } catch {
      redirect('/admin/login?error=config');
    }
    if (users === 0) redirect('/admin/setup');
    redirect('/admin/login');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== 'admin') {
    redirect('/admin?error=forbidden');
  }
  return session;
}
