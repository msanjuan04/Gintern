-- ==========================================
-- GNERAI Finance — schema inicial
-- ==========================================

-- 1. Extensiones
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. users (perfil de cada socio)
-- ==========================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nombre text not null,
  apellidos text,
  nif text not null,
  direccion text,
  cp text,
  ciudad text,
  iban text,
  prefix_factura text not null unique,
  irpf_pct numeric(4,2) default 15.00,
  iva_pct numeric(4,2) default 21.00,
  share_gnerai numeric(5,2) default 50.00,
  telegram_chat_id text,
  created_at timestamptz default now()
);

-- ==========================================
-- 3. clients
-- ==========================================
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  nif text,
  email text,
  contacto text,
  direccion text,
  telefono text,
  notas text,
  activo boolean default true,
  created_at timestamptz default now(),
  created_by uuid references public.users(id)
);

-- ==========================================
-- 4. invoices
-- ==========================================
create type invoice_direction as enum ('issued', 'received');
create type invoice_kind as enum ('client', 'internal_compensation', 'expense_received');
create type recurrence_type as enum ('unique', 'monthly', 'quarterly', 'annual');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');

create table public.invoices (
  id uuid primary key default uuid_generate_v4(),

  issuer_id uuid not null references public.users(id),
  year integer not null,
  sequence_number integer,
  invoice_number text,

  direction invoice_direction not null,
  kind invoice_kind not null,
  client_id uuid references public.clients(id),
  counterparty_user_id uuid references public.users(id),

  base_imponible numeric(12,2) not null,
  iva_pct numeric(4,2) not null default 21.00,
  iva_amount numeric(12,2) not null,
  irpf_pct numeric(4,2) not null default 15.00,
  irpf_amount numeric(12,2) not null,
  total numeric(12,2) not null,

  fecha_emision date not null default current_date,
  fecha_vencimiento date not null,
  fecha_cobro date,

  recurrence recurrence_type not null default 'unique',
  recurrence_parent_id uuid references public.invoices(id),
  next_due_date date,

  status invoice_status not null default 'draft',
  concepto text not null,
  notas text,
  pdf_storage_path text,

  scope text not null default 'gnerai' check (scope in ('gnerai', 'personal')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (issuer_id, year, sequence_number)
);

create index invoices_issuer_year_idx on public.invoices (issuer_id, year);
create index invoices_status_idx on public.invoices (status);
create index invoices_fecha_vencimiento_idx on public.invoices (fecha_vencimiento);

-- ==========================================
-- 5. invoice_lines
-- ==========================================
create table public.invoice_lines (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  descripcion text not null,
  cantidad numeric(10,2) not null default 1,
  precio_unitario numeric(12,2) not null,
  total numeric(12,2) not null,
  orden integer not null default 0
);

create index invoice_lines_invoice_idx on public.invoice_lines (invoice_id);

-- ==========================================
-- 6. movements
-- ==========================================
create type movement_type as enum ('income', 'expense');

create table public.movements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),
  invoice_id uuid references public.invoices(id) on delete cascade,
  tipo movement_type not null,
  scope text not null check (scope in ('gnerai', 'personal')),
  fecha date not null default current_date,
  base_imponible numeric(12,2) not null,
  iva_amount numeric(12,2) default 0,
  irpf_amount numeric(12,2) default 0,
  total numeric(12,2) not null,
  concepto text not null,
  client_id uuid references public.clients(id),
  cobrado boolean not null default false,
  fecha_cobro date,
  attachment_path text,
  created_at timestamptz default now()
);

create index movements_user_scope_fecha_idx on public.movements (user_id, scope, fecha);

-- ==========================================
-- 7. Trigger: numeración correlativa por emisor
-- ==========================================
create or replace function generate_invoice_number()
returns trigger as $$
declare
  v_prefix text;
  v_next_seq integer;
begin
  select prefix_factura into v_prefix from public.users where id = new.issuer_id;

  if new.sequence_number is null then
    select coalesce(max(sequence_number), 0) + 1
      into v_next_seq
      from public.invoices
      where issuer_id = new.issuer_id and year = new.year;
    new.sequence_number := v_next_seq;
  end if;

  new.invoice_number := v_prefix || '-' || new.year || '/' || lpad(new.sequence_number::text, 3, '0');

  return new;
end;
$$ language plpgsql;

create trigger invoices_set_number
  before insert on public.invoices
  for each row
  when (new.invoice_number is null)
  execute function generate_invoice_number();

-- ==========================================
-- 8. Trigger: crear movement automático al crear invoice
-- ==========================================
create or replace function create_movement_from_invoice()
returns trigger as $$
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

  -- Factura interna de compensación: espejo en el otro socio
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
$$ language plpgsql;

create trigger invoices_create_movements
  after insert on public.invoices
  for each row
  execute function create_movement_from_invoice();

-- ==========================================
-- 9. Vista: balance entre socios por trimestre
-- ==========================================
create or replace view public.v_balance_socios
with (security_invoker = true) as
select
  user_id,
  extract(year from fecha)::int as year,
  extract(quarter from fecha)::int as quarter,
  sum(case when tipo = 'income' then base_imponible else 0 end) as ingresos,
  sum(case when tipo = 'expense' then base_imponible else 0 end) as gastos,
  sum(case when tipo = 'income' then base_imponible else -base_imponible end) as aportacion_neta
from public.movements
where scope = 'gnerai'
group by user_id, extract(year from fecha), extract(quarter from fecha);

-- ==========================================
-- 10. Función: balance del trimestre
--     Para cada socio devuelve aportación neta, delta vs el otro,
--     compensación sugerida (si emisora, signo negativo) y semáforo.
-- ==========================================
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
-- 11. RLS — ambos socios ven todo, cada uno solo edita lo suyo
-- ==========================================
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.movements enable row level security;

-- Helper SECURITY DEFINER para evitar recursión RLS al chequear
-- "el usuario actual está en public.users".
create or replace function public.is_partner()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists(select 1 from public.users where id = auth.uid())
$$;
revoke all on function public.is_partner() from public;
grant execute on function public.is_partner() to authenticated;

-- users (cualquier usuario autenticado lee todos los perfiles;
-- la creación de cuentas está controlada en el panel de Supabase)
create policy users_select on public.users for select
  using (auth.uid() is not null);
create policy users_update on public.users for update
  using (auth.uid() = id);

-- clients
create policy clients_all on public.clients for all
  using (public.is_partner())
  with check (public.is_partner());

-- invoices
create policy invoices_select on public.invoices for select
  using (
    scope = 'gnerai'
    or issuer_id = auth.uid()
  );
create policy invoices_insert on public.invoices for insert
  with check (issuer_id = auth.uid());
create policy invoices_update on public.invoices for update
  using (issuer_id = auth.uid());
create policy invoices_delete on public.invoices for delete
  using (issuer_id = auth.uid() and status = 'draft');

-- invoice_lines (heredan permiso de la factura)
create policy invoice_lines_all on public.invoice_lines for all
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (i.scope = 'gnerai' or i.issuer_id = auth.uid())
    )
  );

-- movements
create policy movements_select on public.movements for select
  using (scope = 'gnerai' or user_id = auth.uid());
create policy movements_insert on public.movements for insert
  with check (user_id = auth.uid());
create policy movements_update on public.movements for update
  using (user_id = auth.uid());
create policy movements_delete on public.movements for delete
  using (user_id = auth.uid());

-- ==========================================
-- 12. Storage bucket para PDFs
-- ==========================================
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

create policy "invoices_pdf_select" on storage.objects for select
  using (bucket_id = 'invoices' and auth.uid() is not null);
create policy "invoices_pdf_insert" on storage.objects for insert
  with check (bucket_id = 'invoices' and auth.uid() is not null);
create policy "invoices_pdf_update" on storage.objects for update
  using (bucket_id = 'invoices' and auth.uid() is not null);
