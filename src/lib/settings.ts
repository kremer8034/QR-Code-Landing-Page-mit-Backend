import { getSupabaseAdmin } from './supabase';
import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  app_name: 'Fuhrpark QR',
  primary_color: '#e2001a',
  accent_color: '#222222',
  logo_url: null,
  qr_base_url: null,
  label_headline: 'Fahrzeug-Service',
  label_subtext: 'Hier scannen',
  oidc_enabled: false,
  oidc_issuer: null,
  oidc_client_id: null,
  oidc_client_secret: null,
  oidc_scopes: 'openid email profile',
  oidc_button_label: 'Anmelden mit BRK.id',
  oidc_auto_create: false,
  oidc_allowed_domains: null,
  updated_at: new Date(0).toISOString(),
};

export async function getSettings(): Promise<Settings> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(data as Settings) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Resolve the public base URL used to build QR target links.
 * Priority: explicit setting -> request origin -> env -> empty (relative).
 */
export function resolveBaseUrl(settings: Settings, requestOrigin?: string | null): string {
  if (settings.qr_base_url && settings.qr_base_url.trim()) {
    return settings.qr_base_url.trim().replace(/\/+$/, '');
  }
  if (requestOrigin) return requestOrigin.replace(/\/+$/, '');
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, '');
  return '';
}

/** Pick black or white text for good contrast against a hex background. */
export function contrastText(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return '#ffffff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111111' : '#ffffff';
}

function darken(hex: string, amount = 0.15): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(c.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.slice(4, 6), 16) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Inline CSS variables that drive the Tailwind theme at runtime. */
export function themeStyle(settings: Settings): Record<string, string> {
  return {
    '--brand': settings.primary_color,
    '--brand-fg': contrastText(settings.primary_color),
    '--brand-dark': darken(settings.primary_color, 0.18),
    '--accent': settings.accent_color,
    '--accent-fg': contrastText(settings.accent_color),
  };
}
