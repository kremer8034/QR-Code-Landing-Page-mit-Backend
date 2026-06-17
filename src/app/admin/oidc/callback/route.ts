import { cookies } from 'next/headers';
import { getOidcClient, oidcRedirectUri } from '@/lib/oidc';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createSession } from '@/lib/auth';
import type { AdminUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  let ctx;
  try {
    ctx = await getOidcClient(origin);
  } catch {
    return Response.redirect(`${origin}/admin/login?error=oidc_config`, 302);
  }
  if (!ctx) return Response.redirect(`${origin}/admin/login?error=oidc_disabled`, 302);
  const { client, settings } = ctx;

  const jar = await cookies();
  const codeVerifier = jar.get('oidc_verifier')?.value;
  const expectedState = jar.get('oidc_state')?.value;
  jar.delete('oidc_verifier');
  jar.delete('oidc_state');
  if (!codeVerifier || !expectedState) {
    return Response.redirect(`${origin}/admin/login?error=oidc_state`, 302);
  }

  const params = Object.fromEntries(url.searchParams.entries());

  let claims: Record<string, unknown>;
  try {
    const tokenSet = await client.callback(oidcRedirectUri(origin), params, {
      code_verifier: codeVerifier,
      state: expectedState,
    });
    claims = tokenSet.claims() as Record<string, unknown>;
  } catch {
    return Response.redirect(`${origin}/admin/login?error=oidc_exchange`, 302);
  }

  const sub = String(claims.sub ?? '');
  const email = String(claims.email ?? '').toLowerCase();
  const name =
    String(claims.displayName ?? claims.name ?? `${claims.given_name ?? ''} ${claims.family_name ?? ''}`).trim();
  if (!sub) return Response.redirect(`${origin}/admin/login?error=oidc_claims`, 302);

  const supabase = getSupabaseAdmin();

  // Match by oidc_sub first, then by email (to link an existing local account).
  let user: AdminUser | null = null;
  {
    const { data } = await supabase.from('admin_users').select('*').eq('oidc_sub', sub).maybeSingle();
    user = (data as AdminUser) ?? null;
  }
  if (!user && email) {
    const { data } = await supabase.from('admin_users').select('*').ilike('email', email).maybeSingle();
    user = (data as AdminUser) ?? null;
    if (user) {
      await supabase.from('admin_users').update({ oidc_sub: sub, provider: 'oidc' }).eq('id', user.id);
    }
  }

  // Optionally auto-provision a new backoffice user.
  if (!user) {
    if (!settings.oidc_auto_create) {
      return Response.redirect(`${origin}/admin/login?error=oidc_nouser`, 302);
    }
    const allowed = (settings.oidc_allowed_domains ?? '')
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.length && !allowed.some((d) => email.endsWith(`@${d}`) || email.endsWith(d))) {
      return Response.redirect(`${origin}/admin/login?error=oidc_domain`, 302);
    }
    const { data } = await supabase
      .from('admin_users')
      .insert({ email, name, role: 'editor', provider: 'oidc', oidc_sub: sub })
      .select('*')
      .single();
    user = (data as AdminUser) ?? null;
  }

  if (!user || !user.active) {
    return Response.redirect(`${origin}/admin/login?error=oidc_inactive`, 302);
  }

  await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });

  return Response.redirect(`${origin}/admin`, 302);
}
