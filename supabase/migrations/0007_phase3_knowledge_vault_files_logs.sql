-- ==========================================
-- Fase 3 · Bóveda + Archivos + Wiki + Logs
-- ==========================================

create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  account_identifier text not null,
  secret_hint text,
  vault_secret_ref text,
  environment text not null default 'prod' check (environment in ('prod', 'staging', 'dev', 'other')),
  owner_id uuid not null references public.team_members(id) on delete restrict,
  rotation_due_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credentials_service_idx on public.credentials(service);
create index if not exists credentials_rotation_idx on public.credentials(rotation_due_on);
create index if not exists credentials_owner_idx on public.credentials(owner_id);

drop trigger if exists credentials_set_updated_at on public.credentials;
create trigger credentials_set_updated_at
before update on public.credentials
for each row
execute function public.set_updated_at();

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text,
  external_url text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  version integer not null default 1,
  owner_id uuid not null references public.team_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint files_source_check check (
    external_url is not null or storage_path is not null
  )
);

create index if not exists files_tag_idx on public.files(tag);
create index if not exists files_owner_idx on public.files(owner_id);
create index if not exists files_created_idx on public.files(created_at desc);

drop trigger if exists files_set_updated_at on public.files;
create trigger files_set_updated_at
before update on public.files
for each row
execute function public.set_updated_at();

create table if not exists public.knowledge_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  category text not null default 'general',
  is_published boolean not null default true,
  owner_id uuid not null references public.team_members(id) on delete restrict,
  last_edited_by uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_pages_category_idx on public.knowledge_pages(category);
create index if not exists knowledge_pages_owner_idx on public.knowledge_pages(owner_id);

drop trigger if exists knowledge_pages_set_updated_at on public.knowledge_pages;
create trigger knowledge_pages_set_updated_at
before update on public.knowledge_pages
for each row
execute function public.set_updated_at();

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.team_members(id) on delete set null,
  module text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_module_idx on public.activity_logs(module);
create index if not exists activity_logs_created_idx on public.activity_logs(created_at desc);

alter table public.credentials enable row level security;
alter table public.files enable row level security;
alter table public.knowledge_pages enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists credentials_team_access on public.credentials;
create policy credentials_team_access on public.credentials
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists files_team_access on public.files;
create policy files_team_access on public.files
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists knowledge_pages_team_access on public.knowledge_pages;
create policy knowledge_pages_team_access on public.knowledge_pages
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists activity_logs_team_read on public.activity_logs;
create policy activity_logs_team_read on public.activity_logs
for select
using (public.is_active_team_member());

drop policy if exists activity_logs_team_insert on public.activity_logs;
create policy activity_logs_team_insert on public.activity_logs
for insert
with check (public.is_active_team_member());
