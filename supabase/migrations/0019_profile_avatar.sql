-- Foto de perfil + NIF opcional (perfil simplificado en UI).

begin;

alter table public.users
  alter column nif drop not null;

alter table public.users
  add column if not exists avatar_url text;

commit;

-- Storage: bucket público para avatares (ruta: {user_id}/...)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Avatars public read" on storage.objects;
create policy "Avatars public read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Users insert own avatar" on storage.objects;
create policy "Users insert own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
