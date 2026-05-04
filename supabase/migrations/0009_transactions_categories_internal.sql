-- ==========================================
-- Fase Finanzas · Categorías + movimientos internos
-- ==========================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_category') then
    create type public.transaction_category as enum (
      'saas',
      'structural',
      'variable',
      'service',
      'uncategorized',
      'internal_movement'
    );
  end if;
end $$;

alter table public.transactions
  add column if not exists category public.transaction_category not null default 'uncategorized',
  add column if not exists is_internal_movement boolean not null default false,
  add column if not exists attachment_path text;

create index if not exists transactions_category_idx on public.transactions(category);
create index if not exists transactions_internal_idx on public.transactions(is_internal_movement);

