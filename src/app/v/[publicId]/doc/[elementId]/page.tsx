import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSettings, themeStyle } from '@/lib/settings';
import type { LinkItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DocViewer({
  params,
}: {
  params: Promise<{ publicId: string; elementId: string }>;
}) {
  const { publicId, elementId } = await params;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase.from('links').select('*').eq('id', elementId).maybeSingle();
  const item = data as LinkItem | null;
  if (!item || item.type !== 'pdf' || !item.storage_path) notFound();

  const settings = await getSettings();

  return (
    <div className="h-screen flex flex-col bg-gray-800" style={themeStyle(settings) as React.CSSProperties}>
      <header
        className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
        style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
      >
        <Link href={`/v/${publicId}`} className="inline-flex items-center gap-1 font-medium">
          <ChevronLeft size={20} /> Zurück
        </Link>
        <span className="font-semibold truncate">{item.label || 'Dokument'}</span>
      </header>

      {/* Embedded inline preview. No download button is offered. */}
      <object data={`/api/content/${item.id}#toolbar=0`} type="application/pdf" className="flex-1 w-full">
        <iframe src={`/api/content/${item.id}#toolbar=0`} className="w-full h-full" title={item.label || 'Dokument'} />
      </object>
    </div>
  );
}
