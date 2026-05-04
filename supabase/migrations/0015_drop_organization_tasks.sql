-- Elimina to-dos / Kanban (organization_tasks). Los objetivos siguen en organization_goals.

begin;

drop policy if exists organization_tasks_delete on public.organization_tasks;
drop policy if exists organization_tasks_update on public.organization_tasks;
drop policy if exists organization_tasks_insert on public.organization_tasks;
drop policy if exists organization_tasks_select on public.organization_tasks;

drop trigger if exists organization_tasks_set_updated_at on public.organization_tasks;
drop table if exists public.organization_tasks;

drop type if exists public.organization_task_status;
drop type if exists public.organization_task_priority;

commit;
