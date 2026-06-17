import type { ContentType, LinkItem } from './types';

export interface ContentTypeMeta {
  type: ContentType;
  label: string;       // backoffice label
  defaultIcon: string; // lucide name
  /** true => rendered as a tappable button; false => rendered inline (text/image) */
  button: boolean;
}

export const CONTENT_TYPES: ContentTypeMeta[] = [
  { type: 'link', label: 'Link (Webseite)', defaultIcon: 'Link', button: true },
  { type: 'pdf', label: 'PDF-Dokument', defaultIcon: 'FileText', button: true },
  { type: 'phone', label: 'Telefonnummer', defaultIcon: 'Phone', button: true },
  { type: 'email', label: 'E-Mail-Adresse', defaultIcon: 'Mail', button: true },
  { type: 'address', label: 'Adresse / Navigation', defaultIcon: 'MapPin', button: true },
  { type: 'text', label: 'Info-Text', defaultIcon: 'Info', button: false },
  { type: 'image', label: 'Bild', defaultIcon: 'Image', button: false },
];

export function contentTypeMeta(type: ContentType): ContentTypeMeta {
  return CONTENT_TYPES.find((t) => t.type === type) ?? CONTENT_TYPES[0];
}

export function defaultIconFor(type: ContentType): string {
  return `lucide:${contentTypeMeta(type).defaultIcon}`;
}

/** Normalise a phone number for a tel: link (keep leading + and digits). */
export function telHref(value: string): string {
  const cleaned = value.replace(/[^+\d]/g, '');
  return `tel:${cleaned}`;
}

export function mapsHref(value: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

/**
 * Build the href for a tappable content item. `publicId` is required for PDFs
 * (which open the in-app viewer). Returns null for inline types (text/image).
 */
export function contentHref(item: LinkItem, publicId?: string): string | null {
  switch (item.type) {
    case 'link':
      return item.url || null;
    case 'phone':
      return item.value ? telHref(item.value) : null;
    case 'email':
      return item.value ? `mailto:${item.value}` : null;
    case 'address':
      return item.value ? mapsHref(item.value) : null;
    case 'pdf':
      return publicId ? `/v/${publicId}/doc/${item.id}` : null;
    default:
      return null;
  }
}

/** Short human-readable preview of an item's payload, for backoffice lists. */
export function contentPreview(item: LinkItem): string {
  switch (item.type) {
    case 'link':
      return item.url ?? '';
    case 'phone':
    case 'email':
    case 'address':
      return item.value ?? '';
    case 'pdf':
      return item.storage_path ? 'PDF-Dokument' : '(keine Datei)';
    case 'image':
      return item.storage_path ? 'Bild' : '(kein Bild)';
    case 'text':
      return (item.body ?? '').slice(0, 80);
    default:
      return '';
  }
}
