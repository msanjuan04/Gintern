-- Seed histórico 2026 para Núcleo Financiero GNERAI OS
-- Requiere que exista al menos un usuario admin en team_members.

do $$
declare
  v_created_by uuid;
begin
  select tm.id
  into v_created_by
  from public.team_members tm
  where tm.role = 'admin' and tm.is_active = true
  order by tm.created_at asc
  limit 1;

  if v_created_by is null then
    raise exception 'No hay admin activo en team_members para created_by';
  end if;

  delete from public.transactions
  where issued_at between date '2026-01-01' and date '2026-05-31';

  insert into public.transactions (
    concept,
    type,
    category,
    amount_net,
    tax_amount,
    amount_total,
    issued_at,
    paid_at,
    created_by
  )
  values
    -- INGRESOS
    ('Sin identificar', 'income', 'uncategorized', 150, 0, 150, '2026-01-21', '2026-01-21', v_created_by),
    ('Sin identificar', 'income', 'uncategorized', 110, 0, 110, '2026-01-26', '2026-01-26', v_created_by),
    ('Sin identificar', 'income', 'uncategorized', 190, 0, 190, '2026-02-27', '2026-02-27', v_created_by),
    ('Sin identificar', 'income', 'uncategorized', 339.5, 0, 339.5, '2026-03-24', '2026-03-24', v_created_by),
    ('GTIQ', 'income', 'service', 119, 0, 119, '2026-03-31', '2026-03-31', v_created_by),
    ('Forestal4sl', 'income', 'service', 1350, 0, 1350, '2026-04-10', '2026-04-10', v_created_by),
    ('Forestal4sl', 'income', 'service', 1759, 0, 1759, '2026-04-24', '2026-04-24', v_created_by),
    ('GTIQ', 'income', 'service', 119, 0, 119, '2026-04-30', '2026-04-30', v_created_by),

    -- GASTOS
    ('Apple', 'expense', 'saas', 14.77, 0, 14.77, '2026-02-01', '2026-02-01', v_created_by),
    ('Meta', 'expense', 'saas', 40, 0, 40, '2026-02-03', '2026-02-03', v_created_by),
    ('OpenAI', 'expense', 'saas', 10.31, 0, 10.31, '2026-02-04', '2026-02-04', v_created_by),
    ('Emergent', 'expense', 'saas', 17.62, 0, 17.62, '2026-02-04', '2026-02-04', v_created_by),
    ('Supabase', 'expense', 'saas', 21.46, 0, 21.46, '2026-02-07', '2026-02-07', v_created_by),
    ('Meta', 'expense', 'saas', 110, 0, 110, '2026-02-08', '2026-02-08', v_created_by),
    ('Apple', 'expense', 'saas', 30.50, 0, 30.50, '2026-02-08', '2026-02-08', v_created_by),
    ('Wix Miracle', 'expense', 'saas', 45.98, 0, 45.98, '2026-02-28', '2026-02-28', v_created_by),
    ('Digital Ocean', 'expense', 'saas', 9.33, 0, 9.33, '2026-03-01', '2026-03-01', v_created_by),
    ('Ionos', 'expense', 'saas', 11.62, 0, 11.62, '2026-03-06', '2026-03-06', v_created_by),
    ('N26', 'expense', 'structural', 26.50, 0, 26.50, '2026-03-06', '2026-03-06', v_created_by),
    ('Caltecnic', 'expense', 'structural', 9.90, 0, 9.90, '2026-03-25', '2026-03-25', v_created_by),
    ('Meta', 'expense', 'saas', 10, 0, 10, '2026-03-25', '2026-03-25', v_created_by),
    ('Amazon', 'expense', 'saas', 20.51, 0, 20.51, '2026-03-26', '2026-03-26', v_created_by),
    ('Wix Miracle', 'expense', 'saas', 45.98, 0, 45.98, '2026-03-28', '2026-03-28', v_created_by),
    ('Cursor', 'expense', 'saas', 202.68, 0, 202.68, '2026-03-31', '2026-03-31', v_created_by),
    ('Digital Ocean', 'expense', 'saas', 12.59, 0, 12.59, '2026-04-01', '2026-04-01', v_created_by),
    ('Roca Village', 'expense', 'variable', 132.30, 0, 132.30, '2026-04-12', '2026-04-12', v_created_by),
    ('Ionos', 'expense', 'saas', 8.47, 0, 8.47, '2026-04-12', '2026-04-12', v_created_by),
    ('Rayban', 'expense', 'variable', 37.78, 0, 37.78, '2026-04-22', '2026-04-22', v_created_by),
    ('Ionos', 'expense', 'saas', 8.47, 0, 8.47, '2026-04-24', '2026-04-24', v_created_by),
    ('Claude', 'expense', 'saas', 38.25, 0, 38.25, '2026-04-26', '2026-04-26', v_created_by),
    ('Pepephone', 'expense', 'structural', 15, 0, 15, '2026-04-28', '2026-04-28', v_created_by),
    ('Wix Miracle', 'expense', 'saas', 45.98, 0, 45.98, '2026-04-28', '2026-04-28', v_created_by),
    ('Digital Ocean', 'expense', 'saas', 12.45, 0, 12.45, '2026-05-01', '2026-05-01', v_created_by),

    -- MOVIMIENTOS INTERNOS
    ('Wix Miracle Devolucion', 'income', 'internal_movement', 45.98, 0, 45.98, '2026-03-28', '2026-03-28', v_created_by),
    ('Cortada Retiro', 'expense', 'internal_movement', 212, 0, 212, '2026-04-10', '2026-04-10', v_created_by),
    ('Cortada Retiro', 'expense', 'internal_movement', 400, 0, 400, '2026-04-10', '2026-04-10', v_created_by),
    ('Sanju Retiro', 'expense', 'internal_movement', 600, 0, 600, '2026-04-12', '2026-04-12', v_created_by),
    ('Sanju Inyección', 'income', 'internal_movement', 150, 0, 150, '2026-04-12', '2026-04-12', v_created_by),
    ('Sanju Retiro', 'expense', 'internal_movement', 200, 0, 200, '2026-04-24', '2026-04-24', v_created_by),
    ('Cortada Retiro', 'expense', 'internal_movement', 280, 0, 280, '2026-04-28', '2026-04-28', v_created_by),
    ('Cortada Inyección', 'income', 'internal_movement', 280, 0, 280, '2026-04-28', '2026-04-28', v_created_by);
end $$;

