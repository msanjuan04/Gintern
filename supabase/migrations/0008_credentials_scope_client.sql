-- ==========================================
-- Ajuste Bóveda · scope por cliente/interno
-- ==========================================

alter table public.credentials
  add column if not exists scope text not null default 'internal'
    check (scope in ('internal', 'client')),
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists credentials_scope_idx on public.credentials(scope);
create index if not exists credentials_client_idx on public.credentials(client_id);
