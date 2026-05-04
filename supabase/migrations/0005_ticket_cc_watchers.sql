-- ==========================================
-- Fase 1.1 · CC de compañeros en tickets
-- ==========================================

create table if not exists public.ticket_watchers (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(ticket_id, team_member_id)
);

create index if not exists ticket_watchers_ticket_idx on public.ticket_watchers(ticket_id);
create index if not exists ticket_watchers_member_idx on public.ticket_watchers(team_member_id);

alter table public.ticket_watchers enable row level security;

drop policy if exists ticket_watchers_select on public.ticket_watchers;
create policy ticket_watchers_select on public.ticket_watchers
for select using (public.is_active_team_member());

drop policy if exists ticket_watchers_insert on public.ticket_watchers;
create policy ticket_watchers_insert on public.ticket_watchers
for insert with check (public.is_active_team_member());

drop policy if exists ticket_watchers_delete on public.ticket_watchers;
create policy ticket_watchers_delete on public.ticket_watchers
for delete using (
  public.current_team_member_role() = 'admin'
  or team_member_id = auth.uid()
);
