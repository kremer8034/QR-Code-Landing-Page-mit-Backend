-- Fuhrpark QR – database schema (PostgreSQL / Supabase)
-- Run this in the Supabase SQL editor for a fresh project, then create the
-- public storage buckets 'branding' and 'icons'.

create extension if not exists "pgcrypto";

create table if not exists public.settings (
  id              smallint primary key default 1,
  app_name        text not null default 'Fuhrpark QR',
  primary_color   text not null default '#e2001a',
  accent_color    text not null default '#222222',
  logo_url        text,
  qr_base_url     text,
  label_headline  text not null default 'Fahrzeug-Service',
  label_subtext   text not null default 'Hier scannen',
  oidc_enabled        boolean not null default false,
  oidc_issuer         text,
  oidc_client_id      text,
  oidc_client_secret  text,
  oidc_scopes         text not null default 'openid email profile',
  oidc_button_label   text not null default 'Anmelden mit BRK.id',
  oidc_auto_create    boolean not null default false,
  oidc_allowed_domains text,
  smtp_host       text,
  smtp_port       integer not null default 587,
  smtp_secure     boolean not null default false,
  smtp_user       text,
  smtp_password   text,
  smtp_from       text,
  updated_at      timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null default '',
  role          text not null default 'admin' check (role in ('admin','editor')),
  password_hash text,
  password_salt text,
  provider      text not null default 'local' check (provider in ('local','oidc')),
  oidc_sub      text unique,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  last_login    timestamptz,
  reset_token_hash text,
  reset_expires    timestamptz
);
create index if not exists admin_users_reset_idx on public.admin_users(reset_token_hash);

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  color       text not null default '#888888',
  created_at  timestamptz not null default now()
);

create table if not exists public.vehicles (
  id             uuid primary key default gen_random_uuid(),
  public_id      text not null unique,
  license_plate  text not null default '',
  name           text not null default '',
  group_id       uuid references public.groups(id) on delete set null,
  vin            text not null default '',
  notes          text not null default '',
  label_headline text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists vehicles_group_idx on public.vehicles(group_id);

create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'link'
    check (type in ('link','pdf','phone','email','address','text','image')),
  label       text not null,
  url         text,           -- only for type 'link'
  value       text,           -- phone / email / address
  body        text,           -- info text block
  storage_path text,          -- pdf / image file path (private 'content' bucket)
  mime        text,           -- uploaded file mime type
  description text not null default '',
  icon        text not null default 'lucide:Link',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.link_placements (
  id          uuid primary key default gen_random_uuid(),
  link_id     uuid not null references public.links(id) on delete cascade,
  scope       text not null check (scope in ('global','group','vehicle')),
  group_id    uuid references public.groups(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete cascade,
  position    integer not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint placement_scope_target check (
    (scope = 'global'  and group_id is null and vehicle_id is null) or
    (scope = 'group'   and group_id is not null and vehicle_id is null) or
    (scope = 'vehicle' and vehicle_id is not null and group_id is null)
  )
);
create index if not exists placements_link_idx on public.link_placements(link_id);
create index if not exists placements_group_idx on public.link_placements(group_id);
create index if not exists placements_vehicle_idx on public.link_placements(vehicle_id);

create table if not exists public.icons (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.scans (
  id          bigint generated always as identity primary key,
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  user_agent  text,
  referrer    text,
  ip_hash     text
);
create index if not exists scans_vehicle_idx on public.scans(vehicle_id);
create index if not exists scans_created_idx on public.scans(created_at);

-- Lock everything down: all access is server-side via the service-role key.
alter table public.settings        enable row level security;
alter table public.admin_users     enable row level security;
alter table public.groups          enable row level security;
alter table public.vehicles        enable row level security;
alter table public.links           enable row level security;
alter table public.link_placements enable row level security;
alter table public.icons           enable row level security;
alter table public.scans           enable row level security;

-- Storage buckets (run once):
-- Public buckets for logo + custom icons; private bucket for uploaded
-- documents/images (streamed inline by the app).
-- insert into storage.buckets (id, name, public) values
--   ('branding','branding',true), ('icons','icons',true)
--   on conflict (id) do update set public = true;
-- insert into storage.buckets (id, name, public) values ('content','content',false)
--   on conflict (id) do nothing;
