-- Vistas de consolidación para tickets:
-- agrupamos datos de lectura frecuente para simplificar queries en la app
-- y reducir lógica repetida en TypeScript.

drop view if exists public.vw_ticket_overview;
drop view if exists public.vw_ticket_kpis;

create view public.vw_ticket_overview as
with time_rollup as (
  select
    tt.ticket_id,
    coalesce(
      sum(
        case
          when tt.end_at is null then 0
          when tt.minutes_spent is not null then tt.minutes_spent
          else greatest(0, floor(extract(epoch from (tt.end_at - tt.start_at)) / 60))::int
        end
      ),
      0
    )::int as spent_minutes,
    bool_or(tt.end_at is null) as has_running_timer
  from public.time_tracking tt
  group by tt.ticket_id
),
comment_rollup as (
  select tc.ticket_id, count(*)::int as comment_count
  from public.ticket_comments tc
  group by tc.ticket_id
),
attachment_rollup as (
  select ta.ticket_id, count(*)::int as attachment_count
  from public.ticket_attachments ta
  group by ta.ticket_id
),
dependency_rollup as (
  select td.ticket_id, count(*)::int as dependency_count
  from public.ticket_dependencies td
  group by td.ticket_id
)
select
  t.id,
  t.created_at,
  t.code,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.assignee_id,
  t.reporter_id,
  tm.full_name as assignee_name,
  c.nombre as client_name,
  coalesce(tr.spent_minutes, 0) as spent_minutes,
  coalesce(tr.has_running_timer, false) as has_running_timer,
  (
    coalesce(cr.comment_count, 0) +
    coalesce(ar.attachment_count, 0) +
    coalesce(dr.dependency_count, 0)
  )::int as activity_count
from public.tickets t
left join public.team_members tm on tm.id = t.assignee_id
left join public.clients c on c.id = t.client_id
left join time_rollup tr on tr.ticket_id = t.id
left join comment_rollup cr on cr.ticket_id = t.id
left join attachment_rollup ar on ar.ticket_id = t.id
left join dependency_rollup dr on dr.ticket_id = t.id;

create view public.vw_ticket_kpis as
select
  count(*) filter (where status <> 'done')::int as active_tickets,
  count(*) filter (where status = 'blocked')::int as blocked_tickets,
  count(*) filter (where priority = 'fire' and status <> 'done')::int as active_fires,
  count(*) filter (where status = 'done')::int as closed_tickets,
  count(*) filter (where status = 'done' and priority = 'fire')::int as closed_fires
from public.tickets;

grant select on public.vw_ticket_overview to authenticated;
grant select on public.vw_ticket_kpis to authenticated;
