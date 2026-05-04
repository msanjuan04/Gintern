-- ==========================================
-- Fase 1 · Sistema Operativo GNERAI
-- CRM mejorado + Operaciones y Ticketing + Dashboard de estado
-- ==========================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1) Tipos de dominio
do $$
begin
  if not exists (select 1 from pg_type where typname = 'team_member_role') then
    create type public.team_member_role as enum ('admin', 'operator', 'viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'client_stage') then
    create type public.client_stage as enum ('lead', 'meeting', 'proposal', 'negotiation', 'active', 'inactive');
  end if;
  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type public.ticket_status as enum ('backlog', 'in_progress', 'blocked', 'in_review', 'done');
  end if;
  if not exists (select 1 from pg_type where typname = 'ticket_priority') then
    create type public.ticket_priority as enum ('normal', 'high', 'fire');
  end if;
  if not exists (select 1 from pg_type where typname = 'interaction_type') then
    create type public.interaction_type as enum ('note', 'call', 'meeting', 'email', 'whatsapp', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'time_entry_type') then
    create type public.time_entry_type as enum ('timer', 'manual');
  end if;
end $$;

-- 2) updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) team_members (base para permisos internos)
create table if not exists public.team_members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.team_member_role not null default 'operator',
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger team_members_set_updated_at
before update on public.team_members
for each row
execute function public.set_updated_at();

-- Seed inicial desde public.users existente
insert into public.team_members (id, email, full_name, role)
select
  u.id,
  u.email,
  trim(concat_ws(' ', u.nombre, u.apellidos)),
  'admin'::public.team_member_role
from public.users u
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name;

-- 4) Extensión CRM en clients
alter table public.clients
  add column if not exists stage public.client_stage not null default 'lead',
  add column if not exists owner_id uuid references public.team_members(id),
  add column if not exists estimated_ltv numeric(12,2) not null default 0;

update public.clients
set owner_id = created_by
where owner_id is null and created_by is not null;

-- 5) Proyectos vinculados al cliente
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'done', 'cancelled')),
  owner_id uuid references public.team_members(id),
  start_date date,
  end_date date,
  budget numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create index if not exists projects_client_idx on public.projects(client_id);
create index if not exists projects_status_idx on public.projects(status);

-- 6) Log de interacciones por cliente
create table if not exists public.client_interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  author_id uuid not null references public.team_members(id),
  interaction_type public.interaction_type not null default 'note',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists client_interactions_client_created_idx
  on public.client_interactions(client_id, created_at desc);

-- 7) Tickets y ecosistema de operaciones
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  title text not null,
  description text,
  status public.ticket_status not null default 'backlog',
  priority public.ticket_priority not null default 'normal',
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  assignee_id uuid references public.team_members(id) on delete set null,
  reporter_id uuid not null references public.team_members(id) on delete restrict,
  due_date date,
  estimated_hours numeric(8,2),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tickets_set_updated_at
before update on public.tickets
for each row
execute function public.set_updated_at();

create index if not exists tickets_status_idx on public.tickets(status);
create index if not exists tickets_priority_idx on public.tickets(priority);
create index if not exists tickets_assignee_idx on public.tickets(assignee_id);
create index if not exists tickets_client_idx on public.tickets(client_id);
create index if not exists tickets_due_date_idx on public.tickets(due_date);

create or replace function public.set_ticket_code()
returns trigger
language plpgsql
as $$
declare
  next_num integer;
begin
  if new.code is null then
    select coalesce(max((substring(code from 'TK-([0-9]+)'))::integer), 0) + 1
    into next_num
    from public.tickets
    where code like 'TK-%';
    new.code := 'TK-' || lpad(next_num::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_set_code on public.tickets;
create trigger tickets_set_code
before insert on public.tickets
for each row
execute function public.set_ticket_code();

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.team_members(id),
  body text not null,
  mentions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ticket_comments_set_updated_at
before update on public.ticket_comments
for each row
execute function public.set_updated_at();

create index if not exists ticket_comments_ticket_created_idx
  on public.ticket_comments(ticket_id, created_at asc);

create table if not exists public.ticket_dependencies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  depends_on_ticket_id uuid not null references public.tickets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(ticket_id, depends_on_ticket_id),
  constraint no_self_ticket_dependency check (ticket_id <> depends_on_ticket_id)
);

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  uploader_id uuid not null references public.team_members(id),
  file_path text,
  external_url text,
  label text,
  created_at timestamptz not null default now(),
  constraint attachment_source_check check (
    file_path is not null or external_url is not null
  )
);

create table if not exists public.time_tracking (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id),
  start_at timestamptz not null default now(),
  end_at timestamptz,
  minutes_spent integer,
  entry_type public.time_entry_type not null default 'timer',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_time_entry check (
    (end_at is null and minutes_spent is null) or
    (end_at is not null and (minutes_spent is null or minutes_spent >= 0))
  )
);

create trigger time_tracking_set_updated_at
before update on public.time_tracking
for each row
execute function public.set_updated_at();

create index if not exists time_tracking_ticket_idx on public.time_tracking(ticket_id);
create index if not exists time_tracking_member_idx on public.time_tracking(team_member_id);
create index if not exists time_tracking_start_idx on public.time_tracking(start_at desc);

-- 8) Vistas para dashboard de estado
create or replace view public.vw_active_fires
with (security_invoker = true) as
select count(*)::int as total
from public.tickets
where priority = 'fire'
  and status <> 'done';

create or replace view public.vw_upcoming_deadlines
with (security_invoker = true) as
select count(*)::int as total
from public.tickets
where due_date is not null
  and due_date between current_date and current_date + interval '7 days'
  and status <> 'done';

create or replace view public.vw_projects_at_risk
with (security_invoker = true) as
select count(distinct p.id)::int as total
from public.projects p
join public.tickets t on t.project_id = p.id
where t.status in ('blocked', 'in_review')
  and p.status = 'active';

-- Compatibilidad mientras Propuestas y Finanzas llegan en Fase 2
create or replace view public.vw_unanswered_proposals
with (security_invoker = true) as
select 0::int as total;

create or replace view public.vw_pending_invoices
with (security_invoker = true) as
select count(*)::int as total
from public.invoices
where status in ('sent', 'overdue');

-- 9) Helpers para RLS de equipo interno
create or replace function public.current_team_member_role()
returns public.team_member_role
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select role from public.team_members where id = auth.uid()
$$;
revoke all on function public.current_team_member_role() from public;
grant execute on function public.current_team_member_role() to authenticated;

create or replace function public.is_active_team_member()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists(
    select 1
    from public.team_members tm
    where tm.id = auth.uid()
      and tm.is_active = true
  )
$$;
revoke all on function public.is_active_team_member() from public;
grant execute on function public.is_active_team_member() to authenticated;

-- 10) RLS estricto
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.client_interactions enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.ticket_dependencies enable row level security;
alter table public.ticket_attachments enable row level security;
alter table public.time_tracking enable row level security;

drop policy if exists team_members_read on public.team_members;
create policy team_members_read on public.team_members
for select using (public.is_active_team_member());

drop policy if exists team_members_admin_update on public.team_members;
create policy team_members_admin_update on public.team_members
for update using (public.current_team_member_role() = 'admin')
with check (public.current_team_member_role() = 'admin');

drop policy if exists clients_team_access on public.clients;
create policy clients_team_access on public.clients
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists projects_team_access on public.projects;
create policy projects_team_access on public.projects
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists interactions_team_access on public.client_interactions;
create policy interactions_team_access on public.client_interactions
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets
for select using (public.is_active_team_member());

drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets
for insert with check (
  public.is_active_team_member()
  and reporter_id = auth.uid()
);

drop policy if exists tickets_update on public.tickets;
create policy tickets_update on public.tickets
for update using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists tickets_delete on public.tickets;
create policy tickets_delete on public.tickets
for delete using (public.current_team_member_role() = 'admin');

drop policy if exists ticket_comments_team_access on public.ticket_comments;
create policy ticket_comments_team_access on public.ticket_comments
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists ticket_dependencies_team_access on public.ticket_dependencies;
create policy ticket_dependencies_team_access on public.ticket_dependencies
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists ticket_attachments_team_access on public.ticket_attachments;
create policy ticket_attachments_team_access on public.ticket_attachments
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists time_tracking_select on public.time_tracking;
create policy time_tracking_select on public.time_tracking
for select using (public.is_active_team_member());

drop policy if exists time_tracking_insert on public.time_tracking;
create policy time_tracking_insert on public.time_tracking
for insert with check (
  public.is_active_team_member()
  and team_member_id = auth.uid()
);

drop policy if exists time_tracking_update on public.time_tracking;
create policy time_tracking_update on public.time_tracking
for update using (
  public.current_team_member_role() = 'admin'
  or team_member_id = auth.uid()
)
with check (
  public.current_team_member_role() = 'admin'
  or team_member_id = auth.uid()
);

drop policy if exists time_tracking_delete on public.time_tracking;
create policy time_tracking_delete on public.time_tracking
for delete using (
  public.current_team_member_role() = 'admin'
  or team_member_id = auth.uid()
);
