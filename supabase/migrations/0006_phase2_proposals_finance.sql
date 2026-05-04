-- ==========================================
-- Fase 2 · Propuestas + Núcleo Financiero
-- ==========================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'proposal_status') then
    create type public.proposal_status as enum (
      'draft',
      'sent',
      'in_review',
      'negotiation',
      'won',
      'lost'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'transaction_kind') then
    create type public.transaction_kind as enum ('income', 'expense');
  end if;
end $$;

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  client_id uuid not null references public.clients(id) on delete cascade,
  owner_id uuid not null references public.team_members(id) on delete restrict,
  title text not null,
  status public.proposal_status not null default 'draft',
  amount numeric(12,2) not null check (amount >= 0),
  valid_until date,
  sent_at timestamptz,
  responded_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_status_idx on public.proposals(status);
create index if not exists proposals_client_idx on public.proposals(client_id);
create index if not exists proposals_owner_idx on public.proposals(owner_id);
create index if not exists proposals_valid_until_idx on public.proposals(valid_until);

drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at
before update on public.proposals
for each row
execute function public.set_updated_at();

create or replace function public.set_proposal_code()
returns trigger
language plpgsql
as $$
declare
  next_num integer;
begin
  if new.code is null then
    select coalesce(max((substring(code from 'PR-([0-9]+)'))::integer), 0) + 1
    into next_num
    from public.proposals
    where code like 'PR-%';
    new.code := 'PR-' || lpad(next_num::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists proposals_set_code on public.proposals;
create trigger proposals_set_code
before insert on public.proposals
for each row
execute function public.set_proposal_code();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'EUR',
  billing_period text not null check (billing_period in ('monthly', 'quarterly', 'annual')),
  starts_on date not null,
  next_renewal date,
  owner_id uuid references public.team_members(id) on delete set null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_active_idx on public.subscriptions(is_active);
create index if not exists subscriptions_next_renewal_idx on public.subscriptions(next_renewal);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  kind public.transaction_kind not null,
  concept text not null,
  amount numeric(12,2) not null check (amount >= 0),
  occurred_on date not null,
  client_id uuid references public.clients(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  owner_id uuid not null references public.team_members(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_kind_idx on public.transactions(kind);
create index if not exists transactions_date_idx on public.transactions(occurred_on desc);
create index if not exists transactions_owner_idx on public.transactions(owner_id);

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

alter table public.proposals enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions enable row level security;

drop policy if exists proposals_team_access on public.proposals;
create policy proposals_team_access on public.proposals
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists subscriptions_team_access on public.subscriptions;
create policy subscriptions_team_access on public.subscriptions
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

drop policy if exists transactions_team_access on public.transactions;
create policy transactions_team_access on public.transactions
for all
using (public.is_active_team_member())
with check (public.is_active_team_member());

create or replace view public.vw_unanswered_proposals
with (security_invoker = true) as
select count(*)::int as total
from public.proposals
where status in ('sent', 'in_review', 'negotiation');
