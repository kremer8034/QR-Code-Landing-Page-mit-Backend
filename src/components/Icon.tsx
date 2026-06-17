import { icons as lucideIcons } from 'lucide-react';
import { parseIcon } from '@/lib/icons';

interface IconProps {
  icon: string | null | undefined;
  className?: string;
  size?: number;
}

/**
 * Renders either a built-in lucide icon ('lucide:Name') or a custom uploaded
 * image ('custom:<path>'). Falls back to a generic link icon.
 */
export function Icon({ icon, className, size = 24 }: IconProps) {
  const parsed = parseIcon(icon);

  if (parsed.kind === 'custom' && parsed.url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={parsed.url} alt="" width={size} height={size} className={className} style={{ objectFit: 'contain' }} />;
  }

  const Cmp = (lucideIcons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[parsed.value]
    ?? lucideIcons.Link;
  return <Cmp size={size} className={className} />;
}
