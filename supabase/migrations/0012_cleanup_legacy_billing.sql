-- Limpieza controlada de legado de facturas/movimientos.
-- Motivo: estos módulos ya no forman parte del flujo principal
-- y mantienen tablas/vistas que añaden ruido operativo.

begin;

drop view if exists public.v_balance_socios;
drop view if exists public.vw_pending_invoices;

drop table if exists public.invoice_lines;
drop table if exists public.movements;
drop table if exists public.invoices;

drop type if exists public.invoice_status;
drop type if exists public.movement_type;

commit;
