-- ==========================================
-- Roles: socio (default) vs colaborador
-- ==========================================
-- colaborador: ve clientes, facturas y calendario; NO ve dashboard,
-- movimientos ni balance. Puede crear/editar lo que sí ve.

-- 1. Columna role en public.users
alter table public.users
  add column if not exists role text not null default 'socio'
  check (role in ('socio', 'colaborador'));

-- 2. Helper: ¿el usuario actual es socio?
create or replace function public.is_socio()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists(
    select 1 from public.users
    where id = auth.uid() and role = 'socio'
  )
$$;
revoke all on function public.is_socio() from public;
grant execute on function public.is_socio() to authenticated;

-- 3. El trigger que crea movements al insertar invoices necesita
--    SECURITY DEFINER, porque las nuevas RLS de movements solo dejan
--    escribir a socios y queremos que un colaborador también pueda
--    crear facturas (que internamente generan el movement).
create or replace function create_movement_from_invoice()
returns trigger
security definer
set search_path = public, pg_temp
language plpgsql
as $$
declare
  v_tipo movement_type;
  v_user_id uuid;
begin
  if new.direction = 'issued' then
    v_tipo := 'income';
  else
    v_tipo := 'expense';
  end if;
  v_user_id := new.issuer_id;

  insert into public.movements (
    user_id, invoice_id, tipo, scope, fecha,
    base_imponible, iva_amount, irpf_amount, total,
    concepto, client_id, cobrado
  ) values (
    v_user_id, new.id, v_tipo, new.scope, new.fecha_emision,
    new.base_imponible, new.iva_amount, new.irpf_amount, new.total,
    new.concepto, new.client_id, false
  );

  if new.kind = 'internal_compensation' and new.counterparty_user_id is not null then
    insert into public.movements (
      user_id, invoice_id, tipo, scope, fecha,
      base_imponible, iva_amount, irpf_amount, total,
      concepto, cobrado
    ) values (
      new.counterparty_user_id, new.id, 'expense', new.scope, new.fecha_emision,
      new.base_imponible, new.iva_amount, new.irpf_amount, new.total,
      'Factura recibida: ' || new.concepto, false
    );
  end if;

  return new;
end;
$$;

-- 4. RLS — movimientos solo para socios
drop policy if exists movements_select on public.movements;
drop policy if exists movements_insert on public.movements;
drop policy if exists movements_update on public.movements;
drop policy if exists movements_delete on public.movements;

create policy movements_select on public.movements for select
  using (public.is_socio() and (scope = 'gnerai' or user_id = auth.uid()));
create policy movements_insert on public.movements for insert
  with check (public.is_socio() and user_id = auth.uid());
create policy movements_update on public.movements for update
  using (public.is_socio() and user_id = auth.uid());
create policy movements_delete on public.movements for delete
  using (public.is_socio() and user_id = auth.uid());

-- 5. Vista de balance: solo agrega movements de socios
create or replace view public.v_balance_socios
with (security_invoker = true) as
select
  m.user_id,
  extract(year from m.fecha)::int as year,
  extract(quarter from m.fecha)::int as quarter,
  sum(case when m.tipo = 'income' then m.base_imponible else 0 end) as ingresos,
  sum(case when m.tipo = 'expense' then m.base_imponible else 0 end) as gastos,
  sum(case when m.tipo = 'income' then m.base_imponible else -m.base_imponible end) as aportacion_neta
from public.movements m
join public.users u on u.id = m.user_id
where m.scope = 'gnerai'
  and u.role = 'socio'
group by m.user_id, extract(year from m.fecha), extract(quarter from m.fecha);

-- 6. Función balance: solo compara entre socios
create or replace function get_balance_actual(
  p_year int default extract(year from current_date)::int,
  p_quarter int default extract(quarter from current_date)::int
)
returns table (
  user_id uuid,
  user_nombre text,
  aportacion_neta numeric,
  delta_vs_otro numeric,
  compensacion_sugerida numeric,
  estado text
) as $$
begin
  return query
  with balances as (
    select
      u.id as uid,
      u.nombre,
      coalesce(b.aportacion_neta, 0)::numeric as aportacion
    from public.users u
    left join public.v_balance_socios b
      on b.user_id = u.id and b.year = p_year and b.quarter = p_quarter
    where u.role = 'socio'
  ),
  pares as (
    select
      b1.uid,
      b1.nombre,
      b1.aportacion,
      coalesce(avg(b2.aportacion) filter (where b2.uid <> b1.uid), 0) as media_otros,
      count(*) filter (where b2.uid <> b1.uid) as otros_count
    from balances b1
    cross join balances b2
    group by b1.uid, b1.nombre, b1.aportacion
  )
  select
    p.uid,
    p.nombre,
    p.aportacion,
    case when p.otros_count > 0 then p.aportacion - p.media_otros else 0 end,
    case when p.otros_count > 0 then (p.aportacion - p.media_otros) / 2 else 0 end,
    case
      when p.otros_count = 0 then 'verde'
      when abs(p.aportacion - p.media_otros) < 50 then 'verde'
      when abs(p.aportacion - p.media_otros) < 500 then 'ambar'
      else 'rojo'
    end
  from pares p;
end;
$$ language plpgsql stable;

-- ==========================================
-- Cómo añadir un colaborador:
-- 1) Añade su email al env var ALLOWED_EMAILS con sufijo :colaborador
--    ej: ALLOWED_EMAILS=msanjuan@gnerai.com:socio,nuevo@gnerai.com:colaborador
-- 2) Inserta su fila en public.users (los campos fiscales pueden ser
--    placeholders ya que un colaborador no emite facturas en su nombre):
--      insert into public.users (id, email, nombre, nif, prefix_factura, role)
--      values ('<auth.users.id>', 'nuevo@gnerai.com', 'Nombre', '00000000X',
--              'COLAB1', 'colaborador');
-- 3) Al hacer login, el rol se sincroniza desde el env var.
-- ==========================================
