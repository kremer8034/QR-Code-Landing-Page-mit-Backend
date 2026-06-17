import { getSupabaseAdmin } from './supabase';
import type { LinkItem, LinkPlacement, ResolvedLink, Vehicle } from './types';

export async function getVehicleByPublicId(publicId: string): Promise<Vehicle | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('vehicles')
    .select('*')
    .eq('public_id', publicId)
    .maybeSingle();
  return (data as Vehicle) ?? null;
}

/**
 * Resolve every link that should appear on a vehicle's landing page:
 * global placements + placements for the vehicle's group + vehicle-specific
 * placements. De-duplicated by link, ordered by scope then position.
 */
export async function resolveVehicleLinks(vehicle: Vehicle): Promise<ResolvedLink[]> {
  const supabase = getSupabaseAdmin();

  const orParts = ['scope.eq.global'];
  if (vehicle.group_id) orParts.push(`group_id.eq.${vehicle.group_id}`);
  orParts.push(`vehicle_id.eq.${vehicle.id}`);

  const { data: placements } = await supabase
    .from('link_placements')
    .select('*')
    .eq('enabled', true)
    .or(orParts.join(','));

  const list = (placements as LinkPlacement[]) ?? [];
  if (list.length === 0) return [];

  const linkIds = Array.from(new Set(list.map((p) => p.link_id)));
  const { data: links } = await supabase.from('links').select('*').in('id', linkIds);
  const linkMap = new Map((links as LinkItem[] ?? []).map((l) => [l.id, l]));

  const scopeRank: Record<string, number> = { global: 0, group: 1, vehicle: 2 };

  // Keep the highest-priority (most specific) placement per link.
  const byLink = new Map<string, LinkPlacement>();
  for (const p of list) {
    const existing = byLink.get(p.link_id);
    if (!existing || scopeRank[p.scope] > scopeRank[existing.scope]) {
      byLink.set(p.link_id, p);
    }
  }

  const resolved: ResolvedLink[] = [];
  for (const p of byLink.values()) {
    const link = linkMap.get(p.link_id);
    if (link) resolved.push({ link, scope: p.scope, position: p.position });
  }

  // Per-group ordering: if the vehicle belongs to a group with a custom order,
  // those positions take precedence. Otherwise fall back to the global
  // sort_order (used for vehicles without a group and as a default).
  const groupPos = new Map<string, number>();
  if (vehicle.group_id) {
    const { data: order } = await supabase
      .from('group_link_order')
      .select('link_id, position')
      .eq('group_id', vehicle.group_id);
    for (const o of (order as { link_id: string; position: number }[]) ?? []) {
      groupPos.set(o.link_id, o.position);
    }
  }

  resolved.sort((a, b) => {
    const pa = groupPos.get(a.link.id);
    const pb = groupPos.get(b.link.id);
    if (pa != null && pb != null && pa !== pb) return pa - pb;
    if (pa != null && pb == null) return -1; // group-ordered items first
    if (pa == null && pb != null) return 1;
    if (a.link.sort_order !== b.link.sort_order) return a.link.sort_order - b.link.sort_order;
    if (scopeRank[a.scope] !== scopeRank[b.scope]) return scopeRank[a.scope] - scopeRank[b.scope];
    return a.link.label.localeCompare(b.link.label, 'de');
  });

  return resolved;
}

export async function recordScan(vehicleId: string, meta: { ua?: string; referrer?: string; ipHash?: string }) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('scans').insert({
      vehicle_id: vehicleId,
      user_agent: meta.ua ?? null,
      referrer: meta.referrer ?? null,
      ip_hash: meta.ipHash ?? null,
    });
  } catch {
    // analytics must never break the landing page
  }
}
