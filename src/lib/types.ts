export type Role = 'admin' | 'editor';
export type PlacementScope = 'global' | 'group' | 'vehicle';

export interface Settings {
  id: number;
  app_name: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  qr_base_url: string | null;
  label_headline: string;
  label_subtext: string;
  oidc_enabled: boolean;
  oidc_issuer: string | null;
  oidc_client_id: string | null;
  oidc_client_secret: string | null;
  oidc_scopes: string;
  oidc_button_label: string;
  oidc_auto_create: boolean;
  oidc_allowed_domains: string | null;
  smtp_host: string | null;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from: string | null;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  password_hash: string | null;
  password_salt: string | null;
  provider: 'local' | 'oidc';
  oidc_sub: string | null;
  active: boolean;
  created_at: string;
  last_login: string | null;
  reset_token_hash: string | null;
  reset_expires: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  public_id: string;
  license_plate: string;
  name: string;
  group_id: string | null;
  vin: string;
  notes: string;
  label_headline: string | null;
  active: boolean;
  created_at: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  description: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface LinkPlacement {
  id: string;
  link_id: string;
  scope: PlacementScope;
  group_id: string | null;
  vehicle_id: string | null;
  position: number;
  enabled: boolean;
  created_at: string;
}

export interface IconItem {
  id: string;
  name: string;
  storage_path: string;
  created_at: string;
}

export interface ResolvedLink {
  link: LinkItem;
  scope: PlacementScope;
  position: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
