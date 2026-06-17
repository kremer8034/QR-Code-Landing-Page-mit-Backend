import { supabasePublicUrl } from './supabase';

/**
 * Curated set of built-in button icon templates (lucide-react names).
 * These are offered for selection in the backoffice. Custom uploaded icons
 * use the 'custom:<storage_path>' form instead.
 */
export const ICON_TEMPLATES: { key: string; label: string }[] = [
  { key: 'ClipboardCheck', label: 'Fahrzeugcheck' },
  { key: 'ClipboardList', label: 'Checkliste' },
  { key: 'BookOpen', label: 'Fahrtenbuch' },
  { key: 'FileText', label: 'Dokument' },
  { key: 'FileSpreadsheet', label: 'Tabelle' },
  { key: 'ShieldCheck', label: 'Dienstanweisung' },
  { key: 'Wrench', label: 'Werkstatt' },
  { key: 'Fuel', label: 'Tanken' },
  { key: 'Car', label: 'PKW' },
  { key: 'Truck', label: 'LKW' },
  { key: 'Ambulance', label: 'Rettung' },
  { key: 'MapPin', label: 'Standort' },
  { key: 'Navigation', label: 'Navigation' },
  { key: 'Phone', label: 'Telefon' },
  { key: 'Mail', label: 'E-Mail' },
  { key: 'AlertTriangle', label: 'Warnung' },
  { key: 'LifeBuoy', label: 'Hilfe' },
  { key: 'Stethoscope', label: 'Sanitätsdienst' },
  { key: 'Utensils', label: 'Menü-Service' },
  { key: 'Coffee', label: 'Verpflegung' },
  { key: 'Calendar', label: 'Termine' },
  { key: 'Users', label: 'Team' },
  { key: 'Building2', label: 'Dienststelle' },
  { key: 'Key', label: 'Schlüssel' },
  { key: 'Camera', label: 'Foto / Schaden' },
  { key: 'Info', label: 'Information' },
  { key: 'Settings', label: 'Einstellungen' },
  { key: 'Globe', label: 'Webseite' },
  { key: 'Download', label: 'Download' },
  { key: 'Heart', label: 'Herz' },
  { key: 'Cross', label: 'Kreuz' },
  { key: 'Link', label: 'Allgemeiner Link' },
];

export const DEFAULT_ICON = 'lucide:Link';

export interface ParsedIcon {
  kind: 'lucide' | 'custom';
  /** lucide component name, or the storage path for custom icons */
  value: string;
  /** public URL for custom icons */
  url?: string;
}

export function parseIcon(icon: string | null | undefined): ParsedIcon {
  if (!icon) return { kind: 'lucide', value: 'Link' };
  if (icon.startsWith('custom:')) {
    const path = icon.slice('custom:'.length);
    return { kind: 'custom', value: path, url: supabasePublicUrl('icons', path) };
  }
  if (icon.startsWith('lucide:')) {
    return { kind: 'lucide', value: icon.slice('lucide:'.length) };
  }
  // Bare name -> treat as lucide
  return { kind: 'lucide', value: icon };
}
