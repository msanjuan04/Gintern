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
