-- Médiathèque : un espace de stockage public en lecture, rangé par site
-- (dossier = identifiant du site), et une table qui décrit chaque photo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table public.media (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  storage_path text not null unique,
  url text not null,
  name text not null check (char_length(name) between 1 and 160),
  alt text not null default '' check (char_length(alt) <= 160),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  bytes integer not null check (bytes > 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
create index media_site on public.media (site_id, created_at desc);
alter table public.media enable row level security;

create policy media_read on public.media for select to authenticated
  using (public.has_site_role(site_id, 'contributor'));
create policy media_insert on public.media for insert to authenticated
  with check (public.has_site_role(site_id, 'contributor') and created_by = auth.uid()
              and storage_path like site_id::text || '/%');
create policy media_update on public.media for update to authenticated
  using (public.has_site_role(site_id, 'contributor')) with check (public.has_site_role(site_id, 'contributor'));
create policy media_delete on public.media for delete to authenticated
  using (public.has_site_role(site_id, 'editor'));

-- Fichiers : chaque site n'écrit que dans son dossier ; lecture publique (photos du site).
create or replace function public.media_site_of(p_name text)
returns uuid language sql immutable as $$
  select case when split_part(p_name, '/', 1) ~ '^[0-9a-f-]{36}$' then split_part(p_name, '/', 1)::uuid end;
$$;

create policy media_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_site_role(public.media_site_of(name), 'contributor'));
create policy media_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_site_role(public.media_site_of(name), 'editor'));
