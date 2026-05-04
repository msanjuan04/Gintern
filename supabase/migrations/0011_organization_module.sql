-- ==========================================
-- Modulo Organizacion · tareas y objetivos
-- ==========================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_scope') then
    create type public.organization_scope as enum ('team', 'personal');
  end if;
  if not exists (select 1 from pg_type where typname = 'organization_task_status') then
    create type public.organization_task_status as enum ('todo', 'in_progress', 'done', 'blocked');
  end if;
  if not exists (select 1 from pg_type where typname = 'organization_task_priority') then
    create type public.organization_task_priority as enum ('low', 'medium', 'high');
  end if;
end $$;

create table if not exists public.organization_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.organization_task_status not null default 'todo',
  priority public.organization_task_priority not null default 'medium',
  scope public.organization_scope not null default 'team',
  assignee_id uuid references public.team_members(id) on delete set null,
  created_by uuid not null references public.team_members(id) on delete restrict,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_tasks_status_idx on public.organization_tasks(status);
create index if not exists organization_tasks_assignee_idx on public.organization_tasks(assignee_id);
create index if not exists organization_tasks_scope_idx on public.organization_tasks(scope);
create index if not exists organization_tasks_due_date_idx on public.organization_tasks(due_date);

drop trigger if exists organization_tasks_set_updated_at on public.organization_tasks;
create trigger organization_tasks_set_updated_at
before update on public.organization_tasks
for each row
execute function public.set_updated_at();

create table if not exists public.organization_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  scope public.organization_scope not null default 'personal',
  owner_id uuid references public.team_members(id) on delete set null,
  target_value numeric(12,2) not null default 0,
  current_value numeric(12,2) not null default 0,
  target_date date,
  created_by uuid not null references public.team_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_goals_scope_idx on public.organization_goals(scope);
create index if not exists organization_goals_owner_idx on public.organization_goals(owner_id);
create index if not exists organization_goals_target_date_idx on public.organization_goals(target_date);

drop trigger if exists organization_goals_set_updated_at on public.organization_goals;
create trigger organization_goals_set_updated_at
before update on public.organization_goals
for each row
execute function public.set_updated_at();

alter table public.organization_tasks enable row level security;
alter table public.organization_goals enable row level security;

drop policy if exists organization_tasks_select on public.organization_tasks;
create policy organization_tasks_select on public.organization_tasks
for select using (
  public.is_active_team_member()
  and (
    public.current_team_member_role() = 'admin'
    or scope = 'team'
    or created_by = auth.uid()
    or assignee_id = auth.uid()
  )
);

drop policy if exists organization_tasks_insert on public.organization_tasks;
create policy organization_tasks_insert on public.organization_tasks
for insert with check (
  public.is_active_team_member()
  and (
    public.current_team_member_role() = 'admin'
    or created_by = auth.uid()
  )
);

drop policy if exists organization_tasks_update on public.organization_tasks;
create policy organization_tasks_update on public.organization_tasks
for update using (
  public.is_active_team_member()
  and (
    public.current_team_member_role() = 'admin'
    or created_by = auth.uid()
    or assignee_id = auth.uid()
  )
)
with check (
  public.is_active_team_member()
  and (
    public.current_team_member_role() = 'admin'
    or created_by = auth.uid()
    or assignee_id = auth.uid()
  )
);

drop policy if exists organization_tasks_delete on public.organization_tasks;
create policy organization_tasks_delete on public.organization_tasks
for delete using (
  public.current_team_member_role() = 'admin'
  or created_by = auth.uid()
);

drop policy if exists organization_goals_select on public.organization_goals;
create policy organization_goals_select on public.organization_goals
for select using (
  public.is_active_team_member()
  and (
    public.current_team_member_role() = 'admin'
    or scope = 'team'
    or created_by = auth.uid()
    or owner_id = auth.uid()
  )
);

drop policy if exists organization_goals_insert on public.organization_goals;
create policy organization_goals_insert on public.organization_goals
for insert with check (
  public.is_active_team_member()
  and (
    public.current_team_member_role() = 'admin'
    or created_by = auth.uid()
  )
);

drop policy if exists organization_goals_update on public.organization_goals;
create policy organization_goals_update on public.organization_goals
for update using (
  public.is_active_team_member()
  and (
    public.current_team_member_role() = 'admin'
    or created_by = auth.uid()
    or owner_id = auth.uid()
  )
)
with check (
  public.is_active_team_member()
  and (
    public.current_team_member_role() = 'admin'
    or created_by = auth.uid()
    or owner_id = auth.uid()
  )
);

drop policy if exists organization_goals_delete on public.organization_goals;
create policy organization_goals_delete on public.organization_goals
for delete using (
  public.current_team_member_role() = 'admin'
  or created_by = auth.uid()
);

