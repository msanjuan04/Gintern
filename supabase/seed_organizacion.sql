-- Seed demo solo para objetivos (tareas Kanban eliminadas).

do $$
declare
  v_admin_id uuid;
  v_member_2 uuid;
begin
  select id
  into v_admin_id
  from public.team_members
  where role = 'admin' and is_active = true
  order by created_at asc
  limit 1;

  select id
  into v_member_2
  from public.team_members
  where is_active = true and id <> v_admin_id
  order by created_at asc
  limit 1;

  if v_admin_id is null then
    raise exception 'No hay admin activo en team_members';
  end if;

  delete from public.organization_goals
  where description like '[DEMO] %';

  insert into public.organization_goals (
    title,
    description,
    scope,
    owner_id,
    target_value,
    current_value,
    target_date,
    created_by
  )
  values
    ('NPS clientes Q2', '[DEMO] Subir satisfacción media del equipo.', 'team', v_admin_id, 80, 58, current_date + 45, v_admin_id),
    ('Reducir tiempo medio ticket', '[DEMO] Objetivo operativo de equipo.', 'team', coalesce(v_member_2, v_admin_id), 24, 31, current_date + 30, v_admin_id),
    ('Bloques de foco semanales', '[DEMO] Objetivo personal de productividad.', 'personal', v_admin_id, 12, 5, current_date + 20, v_admin_id),
    ('Mejorar tasa de cierre', '[DEMO] Meta personal comercial.', 'personal', coalesce(v_member_2, v_admin_id), 10, 4, current_date + 35, v_admin_id);
end $$;
