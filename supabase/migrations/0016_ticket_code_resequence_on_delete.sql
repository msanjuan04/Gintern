-- Reordena códigos de tickets para evitar huecos tras borrados.
-- Ejemplo: si se elimina TK-000123, los posteriores bajan una posición.

create or replace function public.resequence_ticket_codes()
returns void
language plpgsql
as $$
begin
  -- Fase 1: códigos temporales para evitar choques del unique(code)
  update public.tickets
  set code = '__TMP__' || id::text;

  -- Fase 2: numeración correlativa estable por antigüedad
  with ordered as (
    select
      id,
      row_number() over (order by created_at asc, id asc) as seq
    from public.tickets
  )
  update public.tickets t
  set code = 'TK-' || lpad(ordered.seq::text, 6, '0')
  from ordered
  where t.id = ordered.id;
end;
$$;

create or replace function public.resequence_ticket_codes_after_delete()
returns trigger
language plpgsql
as $$
begin
  perform public.resequence_ticket_codes();
  return null;
end;
$$;

drop trigger if exists tickets_resequence_on_delete on public.tickets;
create trigger tickets_resequence_on_delete
after delete on public.tickets
for each statement
execute function public.resequence_ticket_codes_after_delete();

-- Normaliza posibles huecos existentes al aplicar la migración.
select public.resequence_ticket_codes();
