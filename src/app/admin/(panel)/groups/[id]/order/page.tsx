import { notFound } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Alert, Card, CardBody, LinkButton, PageHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { contentPreview, contentTypeMeta } from '@/lib/content';
import { moveGroupLink } from '../../actions';
import type { Group, LinkItem, LinkPlacement } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function GroupOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: groupData } = await supabase.from('groups').select('*').eq('id', id).maybeSingle();
  const group = groupData as Group | null;
  if (!group) notFound();

  // Content shown for this group: global + group-scoped placements.
  const { data: placements } = await supabase
    .from('link_placements')
    .select('*')
    .eq('enabled', true)
    .or(`scope.eq.global,group_id.eq.${id}`);
  const placementList = (placements as LinkPlacement[]) ?? [];
  const scopeByLink = new Map<string, string>();
  for (const p of placementList) {
    // group scope wins over global for the badge
    if (!scopeByLink.has(p.link_id) || p.scope === 'group') scopeByLink.set(p.link_id, p.scope);
  }
  const linkIds = Array.from(new Set(placementList.map((p) => p.link_id)));

  let items: LinkItem[] = [];
  const posMap = new Map<string, number>();
  if (linkIds.length) {
    const [{ data: links }, { data: order }] = await Promise.all([
      supabase.from('links').select('*').in('id', linkIds),
      supabase.from('group_link_order').select('link_id, position').eq('group_id', id),
    ]);
    items = (links as LinkItem[]) ?? [];
    for (const o of (order as { link_id: string; position: number }[]) ?? []) posMap.set(o.link_id, o.position);

    items.sort((a, b) => {
      const pa = posMap.get(a.id);
      const pb = posMap.get(b.id);
      if (pa != null && pb != null && pa !== pb) return pa - pb;
      if (pa != null && pb == null) return -1;
      if (pa == null && pb != null) return 1;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.label.localeCompare(b.label, 'de');
    });
  }

  return (
    <div>
      <PageHeader
        title={`Reihenfolge · ${group.name}`}
        subtitle="Reihenfolge der Inhalte auf den Landingpages dieser Gruppe"
        action={<LinkButton href="/admin/groups" variant="ghost">Zurück</LinkButton>}
      />

      <div className="mb-4">
        <Alert kind="info">
          Diese Reihenfolge gilt nur für Fahrzeuge dieser Gruppe. Enthalten sind globale Inhalte und die
          Inhalte dieser Gruppe. Fahrzeug-spezifische Inhalte erscheinen danach.
        </Alert>
      </div>

      {items.length === 0 ? (
        <Card><CardBody><p className="text-gray-500 text-center py-6">Für diese Gruppe sind keine Inhalte hinterlegt.</p></CardBody></Card>
      ) : (
        <div className="space-y-2">
          {items.map((l, i) => (
            <Card key={l.id}>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <form action={moveGroupLink}>
                      <input type="hidden" name="group_id" value={id} />
                      <input type="hidden" name="link_id" value={l.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button type="submit" title="Nach oben" disabled={i === 0} className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-20">
                        <ChevronUp size={16} />
                      </button>
                    </form>
                    <form action={moveGroupLink}>
                      <input type="hidden" name="group_id" value={id} />
                      <input type="hidden" name="link_id" value={l.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button type="submit" title="Nach unten" disabled={i === items.length - 1} className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-20">
                        <ChevronDown size={16} />
                      </button>
                    </form>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}>
                    <Icon icon={l.icon} size={20} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 block truncate">{l.label || contentTypeMeta(l.type).label}</span>
                    <span className="text-xs text-gray-400 truncate block">{contentPreview(l)}</span>
                  </span>
                  <span className="flex flex-wrap gap-1 justify-end shrink-0">
                    <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">{contentTypeMeta(l.type).label}</span>
                    {scopeByLink.get(l.id) === 'global' ? <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">global</span> : <span className="text-xs rounded-full bg-blue-100 text-blue-700 px-2 py-0.5">Gruppe</span>}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
