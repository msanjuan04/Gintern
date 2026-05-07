-- Eventos manuales para el módulo Calendario (reuniones, hitos, notas, etc.)

create table if not exists public.calendar_manual_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  category text not null default 'other' check (category in ('meeting', 'deadline', 'milestone', 'note', 'other')),
  priority text not null default 'normal' check (priority in ('normal', 'high', 'critical')),
  is_done boolean not null default false,
  owner_id uuid references public.team_members(id) on delete set null,
  created_by uuid not null references public.team_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_manual_events_date_idx
  on public.calendar_manual_events(event_date);
create index if not exists calendar_manual_events_category_idx
  on public.calendar_manual_events(category);
create index if not exists calendar_manual_events_owner_idx
  on public.calendar_manual_events(owner_id);

drop trigger if exists calendar_manual_events_set_updated_at on public.calendar_manual_events;
create trigger calendar_manual_events_set_updated_at
before update on public.calendar_manual_events
for each row
execute function public.set_updated_at();

alter table public.calendar_manual_events enable row level security;

drop policy if exists calendar_manual_events_team_access on public.calendar_manual_events;
create policy calendar_manual_events_team_access on public.calendar_manual_events
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());
