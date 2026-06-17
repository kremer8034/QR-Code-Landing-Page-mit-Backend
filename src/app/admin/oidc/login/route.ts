import { cookies } from 'next/headers';
import { getOidcClient, generators } from '@/lib/oidc';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  let ctx;
  try {
    ctx = await getOidcClient(origin);
  } catch {
    return Response.redirect(`${origin}/admin/login?error=oidc_config`, 302);
  }
  if (!ctx) return Response.redirect(`${origin}/admin/login?error=oidc_disabled`, 302);

  const { client, settings } = ctx;
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();

  const jar = await cookies();
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 600 };
  jar.set('oidc_verifier', codeVerifier, opts);
  jar.set('oidc_state', state, opts);

  const url = client.authorizationUrl({
    scope: settings.oidc_scopes || 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return Response.redirect(url, 302);
}
