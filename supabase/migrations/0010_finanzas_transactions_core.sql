-- ==========================================
-- Núcleo Financiero GNERAI OS · transactions
-- ==========================================

create extension if not exists "pgcrypto";

-- Reiniciamos la tabla para garantizar el esquema exacto solicitado.
drop table if exists public.transactions cascade;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  concept text not null,
  type text not null check (type in ('income', 'expense')),
  category text not null check (
    category in (
      'saas',
      'structural',
      'variable',
      'service',
      'uncategorized',
      'internal_movement'
    )
  ),
  amount_net numeric not null,
  tax_amount numeric not null default 0,
  amount_total numeric not null,
  issued_at date not null,
  paid_at date,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  invoice_file_path text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_type_idx on public.transactions(type);
create index transactions_category_idx on public.transactions(category);
create index transactions_issued_at_idx on public.transactions(issued_at desc);
create index transactions_client_id_idx on public.transactions(client_id);
create index transactions_project_id_idx on public.transactions(project_id);
create index transactions_created_by_idx on public.transactions(created_by);

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

alter table public.transactions enable row level security;

drop policy if exists transactions_admin_select on public.transactions;
create policy transactions_admin_select on public.transactions
for select
using (
  exists (
    select 1
    from public.team_members tm
    where tm.id = auth.uid()
      and tm.is_active = true
      and tm.role = 'admin'
  )
);

drop policy if exists transactions_admin_insert on public.transactions;
create policy transactions_admin_insert on public.transactions
for insert
with check (
  exists (
    select 1
    from public.team_members tm
    where tm.id = auth.uid()
      and tm.is_active = true
      and tm.role = 'admin'
  )
);

drop policy if exists transactions_admin_update on public.transactions;
create policy transactions_admin_update on public.transactions
for update
using (
  exists (
    select 1
    from public.team_members tm
    where tm.id = auth.uid()
      and tm.is_active = true
      and tm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.team_members tm
    where tm.id = auth.uid()
      and tm.is_active = true
      and tm.role = 'admin'
  )
);

drop policy if exists transactions_admin_delete on public.transactions;
create policy transactions_admin_delete on public.transactions
for delete
using (
  exists (
    select 1
    from public.team_members tm
    where tm.id = auth.uid()
      and tm.is_active = true
      and tm.role = 'admin'
  )
);

