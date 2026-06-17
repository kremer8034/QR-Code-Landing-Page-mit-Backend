const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Normalise and validate a user-supplied web link.
 * - trims input
 * - adds https:// when no scheme is given
 * - allows only http(s); rejects dangerous schemes (javascript:, data:, …)
 * Returns the cleaned URL, or null if empty/invalid.
 */
export function sanitizeWebUrl(raw: string): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;

  const schemeMatch = value.match(/^([a-z][a-z0-9+.-]*):/i);
  let candidate = value;
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') return null; // block javascript:, data:, file:, …
  } else {
    candidate = `https://${value}`;
  }

  try {
    const u = new URL(candidate);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}
