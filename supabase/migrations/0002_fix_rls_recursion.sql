-- Fix de recursión infinita en políticas RLS que referenciaban public.users.
-- Aplica esto al proyecto Supabase ya creado (después de 0001_init.sql).

-- Helper SECURITY DEFINER: comprueba si el usuario actual es socio
-- (existe en public.users). Como es SECURITY DEFINER y su owner bypassa RLS,
-- no entra en el bucle infinito de la versión anterior.
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

-- users
drop policy if exists users_select on public.users;
create policy users_select on public.users for select
  using (auth.uid() is not null);

-- clients
drop policy if exists clients_all on public.clients;
create policy clients_all on public.clients for all
  using (public.is_partner())
  with check (public.is_partner());

-- Verificación: ambas tablas deberían responder a un select sin recursión.
select count(*) as users_count from public.users;
select count(*) as clients_count from public.clients;
