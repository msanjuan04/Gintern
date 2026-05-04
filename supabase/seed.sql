-- Seed histórico real 2026 para public.transactions
-- Ejecutar después de aplicar migraciones.

do $$
declare
  v_owner_id uuid;
begin
  select id
  into v_owner_id
  from public.team_members
  order by created_at asc
  limit 1;

  if v_owner_id is null then
    raise exception 'No existe ningún team_member. Crea al menos uno antes de ejecutar el seed.';
  end if;

  -- Limpiamos solo el tramo a resembrar para que sea idempotente.
  delete from public.transactions
  where occurred_on between date '2026-01-01' and date '2026-05-31';

  insert into public.transactions (
    kind,
    concept,
    amount,
    occurred_on,
    owner_id,
    category,
    is_internal_movement,
    notes
  )
  values
    ('income',  'Sin identificar', 150.00, date '2026-01-21', v_owner_id, 'uncategorized', false, 'Ingreso sin origen identificado'),
    ('income',  'Sin identificar', 110.00, date '2026-01-26', v_owner_id, 'uncategorized', false, 'Ingreso sin origen identificado'),

    ('expense', 'Apple', 14.77, date '2026-02-01', v_owner_id, 'saas', false, null),
    ('expense', 'Meta', 40.00, date '2026-02-03', v_owner_id, 'saas', false, null),
    ('expense', 'OpenAI', 10.31, date '2026-02-04', v_owner_id, 'saas', false, null),
    ('expense', 'Emergent', 17.62, date '2026-02-04', v_owner_id, 'saas', false, null),
    ('expense', 'Supabase', 21.46, date '2026-02-07', v_owner_id, 'saas', false, null),
    ('expense', 'Meta', 110.00, date '2026-02-08', v_owner_id, 'saas', false, null),
    ('expense', 'Apple', 30.50, date '2026-02-08', v_owner_id, 'saas', false, null),
    ('income',  'Sin identificar', 190.00, date '2026-02-27', v_owner_id, 'uncategorized', false, 'Ingreso sin origen identificado'),
    ('expense', 'Wix Miracle', 45.98, date '2026-02-28', v_owner_id, 'saas', false, null),

    ('expense', 'Digital Ocean', 9.33, date '2026-03-01', v_owner_id, 'saas', false, null),
    ('expense', 'Ionos', 11.62, date '2026-03-06', v_owner_id, 'saas', false, null),
    ('expense', 'N26', 26.50, date '2026-03-06', v_owner_id, 'structural', false, null),
    ('income',  'Sin identificar', 339.50, date '2026-03-24', v_owner_id, 'uncategorized', false, 'Ingreso sin origen identificado'),
    ('expense', 'Caltecnic', 9.90, date '2026-03-25', v_owner_id, 'structural', false, null),
    ('expense', 'Meta', 10.00, date '2026-03-25', v_owner_id, 'saas', false, null),
    ('expense', 'Amazon', 20.51, date '2026-03-26', v_owner_id, 'saas', false, null),
    ('expense', 'Wix Miracle', 45.98, date '2026-03-28', v_owner_id, 'saas', false, null),
    ('income',  'Wix Miracle devolución', 45.98, date '2026-03-28', v_owner_id, 'internal_movement', true, 'Movimiento interno que no afecta al beneficio neto'),
    ('income',  'GTIQ', 119.00, date '2026-03-31', v_owner_id, 'service', false, null),
    ('expense', 'Cursor', 202.68, date '2026-03-31', v_owner_id, 'saas', false, null),

    ('expense', 'Digital Ocean', 12.59, date '2026-04-01', v_owner_id, 'saas', false, null),
    ('income',  'Forestal4sl', 1350.00, date '2026-04-10', v_owner_id, 'service', false, null),
    ('expense', 'Cortada', 212.00, date '2026-04-10', v_owner_id, 'internal_movement', true, 'Movimiento interno de socio'),
    ('expense', 'Cortada', 400.00, date '2026-04-10', v_owner_id, 'internal_movement', true, 'Movimiento interno de socio'),
    ('expense', 'Sanju', 600.00, date '2026-04-12', v_owner_id, 'internal_movement', true, 'Movimiento interno de socio'),
    ('income',  'Sanju', 150.00, date '2026-04-12', v_owner_id, 'internal_movement', true, 'Movimiento interno de socio'),
    ('expense', 'Roca Village', 132.30, date '2026-04-12', v_owner_id, 'variable', false, null),
    ('expense', 'Ionos', 8.47, date '2026-04-12', v_owner_id, 'saas', false, null),
    ('expense', 'Rayban', 37.78, date '2026-04-22', v_owner_id, 'variable', false, null),
    ('expense', 'Ionos', 8.47, date '2026-04-24', v_owner_id, 'saas', false, null),
    ('income',  'Forestal4sl', 1759.00, date '2026-04-24', v_owner_id, 'service', false, null),
    ('expense', 'Sanju', 200.00, date '2026-04-24', v_owner_id, 'internal_movement', true, 'Movimiento interno de socio'),
    ('expense', 'Claude', 38.25, date '2026-04-26', v_owner_id, 'saas', false, null),
    ('expense', 'Pepephone', 15.00, date '2026-04-28', v_owner_id, 'structural', false, null),
    ('expense', 'Wix Miracle', 45.98, date '2026-04-28', v_owner_id, 'saas', false, null),
    ('expense', 'Cortada', 280.00, date '2026-04-28', v_owner_id, 'internal_movement', true, 'Movimiento interno de socio'),
    ('income',  'Cortada', 280.00, date '2026-04-28', v_owner_id, 'internal_movement', true, 'Movimiento interno de socio'),
    ('income',  'GTIQ', 119.00, date '2026-04-30', v_owner_id, 'service', false, null),

    ('expense', 'Digital Ocean', 12.45, date '2026-05-01', v_owner_id, 'saas', false, null);
end $$;

-- Seed de los dos socios.
--
-- Pre-requisito: que cada socio se haya autenticado al menos una vez con su
-- magic link, lo que crea su fila en auth.users. Si todavía no han iniciado
-- sesión, este script no insertará nada (insert ... select sobre vacío).
--
-- Resuelve los UUIDs automáticamente por email — no hay que copiarlos a mano.

insert into public.users (
  id, email, nombre, apellidos, nif,
  direccion, cp, ciudad, iban, prefix_factura
)
select
  au.id,
  'msanjuan@gnerai.com',
  'Marc',
  'Sanjuan Sardañes',
  '48174989V',
  'Calle Balmes 307, 4º 3ª',
  '08006',
  'Barcelona',
  'ES72 0049 4709 4522 9502 7128',
  'MS'
from auth.users au
where au.email = 'msanjuan@gnerai.com'
on conflict (id) do nothing;

insert into public.users (
  id, email, nombre, apellidos, nif,
  direccion, cp, ciudad, iban, prefix_factura
)
select
  au.id,
  'mcortada@gnerai.com',
  'Marc',
  'Cortada Roca',
  '39946747W',
  'Carrer Unió 90, 3º, 1ª',
  '08302',
  'Mataró',
  'ES10 1465 0120 31 1756724849',
  'MC'
from auth.users au
where au.email = 'mcortada@gnerai.com'
on conflict (id) do nothing;

-- Verificación:
select id, email, nombre, prefix_factura from public.users order by prefix_factura;
