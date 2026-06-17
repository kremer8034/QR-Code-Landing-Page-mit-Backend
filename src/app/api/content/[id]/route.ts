import { getSupabaseAdmin } from '@/lib/supabase';
import type { LinkItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Streams an uploaded content file (PDF or image) inline from the private
 * 'content' bucket. Served without a Content-Disposition: attachment header so
 * PDFs render in an embedded viewer rather than downloading.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('links')
    .select('storage_path, mime, type')
    .eq('id', id)
    .maybeSingle();
  const item = data as Pick<LinkItem, 'storage_path' | 'mime' | 'type'> | null;

  if (!item || !item.storage_path) return new Response('not found', { status: 404 });

  const { data: file, error } = await supabase.storage.from('content').download(item.storage_path);
  if (error || !file) return new Response('not found', { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  return new Response(new Uint8Array(buffer), {
    headers: {
      'content-type': item.mime || 'application/octet-stream',
      'content-disposition': 'inline',
      'cache-control': 'private, max-age=300',
    },
  });
}
