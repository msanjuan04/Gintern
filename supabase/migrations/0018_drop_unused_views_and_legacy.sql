-- Limpieza definitiva de objetos sin consumidores en código.
-- Tras eliminar los módulos Facturas / Movimientos / Balance del producto,
-- estas vistas, funciones y tabla quedaron huérfanas en BD.

begin;

-- 1. Vistas declaradas en migraciones antiguas que ya no se consultan desde el código.
drop view if exists public.vw_active_fires;
drop view if exists public.vw_projects_at_risk;
drop view if exists public.vw_unanswered_proposals;
drop view if exists public.vw_upcoming_deadlines;

-- 2. Función legacy del módulo Balance (dependía de la tabla `movements`,
--    ya borrada en 0012). Sin uso en código.
drop function if exists public.get_balance_actual(int, int);
drop function if exists public.get_balance_actual(integer, integer);

-- 3. Migrar política RLS de `clients` para no depender de is_partner().
--    Antes: usaba public.is_partner(). Ahora: cualquier team_member activo.
drop policy if exists clients_all on public.clients;
create policy clients_all on public.clients for all
  using (public.is_active_team_member())
  with check (public.is_active_team_member());

-- 4. Funciones legacy del esquema RLS original.
--    `is_partner` y `is_socio` quedaron sin consumidores tras drop de invoices/movements
--    y de la política de clients que acabamos de migrar.
drop function if exists public.is_partner();
drop function if exists public.is_socio();

-- 5. Tabla `files` definida en la fase 3 que nunca se llegó a usar
--    desde la app (el módulo Drive vive en knowledge_pages).
drop table if exists public.files cascade;

commit;
