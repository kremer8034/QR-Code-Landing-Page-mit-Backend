import { Issuer, generators, type Client } from 'openid-client';
import { getSettings } from './settings';
import type { Settings } from './types';

export function oidcRedirectUri(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/admin/oidc/callback`;
}

export async function getOidcClient(origin: string): Promise<{ client: Client; settings: Settings } | null> {
  const settings = await getSettings();
  if (!settings.oidc_enabled || !settings.oidc_issuer || !settings.oidc_client_id) return null;

  const issuer = await Issuer.discover(settings.oidc_issuer);
  const client = new issuer.Client({
    client_id: settings.oidc_client_id,
    client_secret: settings.oidc_client_secret ?? undefined,
    redirect_uris: [oidcRedirectUri(origin)],
    response_types: ['code'],
    token_endpoint_auth_method: settings.oidc_client_secret ? 'client_secret_basic' : 'none',
  });
  return { client, settings };
}

export { generators };
