-- CMS UpSEO : socle multi-sites.
-- Un seul projet sert tous les sites clients ; chaque ligne porte son site_id
-- et les règles d'accès (RLS) isolent strictement les sites entre eux.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- rôles

create type public.site_role as enum ('admin', 'editor', 'contributor');

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  domain text not null,
  created_at timestamptz not null default now()
);

-- Super-admins de la plateforme (UpSEO) : accès à tous les sites et aux réglages techniques.
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.site_members (
  site_id uuid not null references public.sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.site_role not null,
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create or replace function public.site_role_of(p_site uuid)
returns public.site_role language sql stable security definer set search_path = public as $$
  select role from site_members where site_id = p_site and user_id = auth.uid();
$$;

-- Le rôle courant a-t-il au moins le niveau demandé sur ce site ?
create or replace function public.has_site_role(p_site uuid, p_min public.site_role)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or coalesce(
           (array_position(array['contributor','editor','admin']::public.site_role[], public.site_role_of(p_site))
            >= array_position(array['contributor','editor','admin']::public.site_role[], p_min)),
           false);
$$;

-- ---------------------------------------------------------------- pages

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9-]+$'),
  path text not null check (path ~ '^/([a-z0-9-]+(/[a-z0-9-]+)*)?$'),
  parent_id uuid references public.pages (id) on delete set null,
  template text not null,
  sort_order integer not null default 0,
  label text not null check (char_length(label) between 1 and 60),
  in_menu boolean not null default false,
  -- Brouillon en cours : { seo, blocks }. Validé par le serveur avant écriture.
  draft jsonb not null,
  published_version_id uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  unique (site_id, key)
);
create unique index pages_live_path on public.pages (site_id, path) where deleted_at is null;

-- Historique : chaque publication (et chaque restauration) crée une version figée.
create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  snapshot jsonb not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
create index page_versions_page on public.page_versions (page_id, created_at desc);

alter table public.pages
  add constraint pages_published_version_fk
  foreign key (published_version_id) references public.page_versions (id) on delete set null;

-- Champs techniques réservés aux super-admins : adresse, modèle, données structurées, indexation.
create or replace function public.guard_page_technical_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_platform_admin() then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    -- Déplacer une page (adresse, parent) passe par le serveur, qui crée la redirection.
    if new.path is distinct from old.path
       or new.parent_id is distinct from old.parent_id
       or new.template is distinct from old.template
       or new.key is distinct from old.key
       or new.site_id is distinct from old.site_id
       or (new.draft -> 'seo' -> 'jsonLd') is distinct from (old.draft -> 'seo' -> 'jsonLd')
       or (new.draft -> 'seo' -> 'noindex') is distinct from (old.draft -> 'seo' -> 'noindex') then
      raise exception 'Champ technique verrouillé : modification réservée à l''administratrice du site'
        using errcode = '42501';
    end if;
    -- Un contributeur ne modifie que le brouillon : ni publication, ni suppression, ni rangement.
    if not public.has_site_role(new.site_id, 'editor')
       and (new.published_version_id is distinct from old.published_version_id
            or new.deleted_at is distinct from old.deleted_at
            or new.parent_id is distinct from old.parent_id
            or new.sort_order is distinct from old.sort_order
            or new.label is distinct from old.label
            or new.in_menu is distinct from old.in_menu) then
      raise exception 'Action réservée aux éditeurs et administrateurs' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'INSERT' and ((new.draft -> 'seo') ? 'jsonLd' or (new.draft -> 'seo') ? 'noindex') then
    raise exception 'Champ technique verrouillé' using errcode = '42501';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger pages_guard before insert or update on public.pages
  for each row execute function public.guard_page_technical_fields();

-- ---------------------------------------------------------------- réglages, redirections, messages

create table public.site_settings (
  site_id uuid not null references public.sites (id) on delete cascade,
  key text not null,
  value jsonb not null,
  technical boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (site_id, key)
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  from_path text not null check (from_path ~ '^/'),
  to_path text check (to_path is null or to_path ~ '^(/|https://)'),
  status smallint not null check (status in (301, 302, 410)),
  origin text not null default 'manual' check (origin in ('manual', 'auto')),
  created_at timestamptz not null default now(),
  unique (site_id, from_path),
  check ((status = 410) = (to_path is null))
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 255),
  phone text check (char_length(phone) <= 30),
  city text check (char_length(city) <= 80),
  work_type text check (char_length(work_type) <= 80),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'done', 'spam')),
  created_at timestamptz not null default now()
);
create index messages_site on public.messages (site_id, created_at desc);

create table public.activity_log (
  id bigint generated always as identity primary key,
  site_id uuid references public.sites (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index activity_site on public.activity_log (site_id, created_at desc);

-- ---------------------------------------------------------------- règles d'accès

alter table public.sites enable row level security;
alter table public.platform_admins enable row level security;
alter table public.site_members enable row level security;
alter table public.pages enable row level security;
alter table public.page_versions enable row level security;
alter table public.site_settings enable row level security;
alter table public.redirects enable row level security;
alter table public.messages enable row level security;
alter table public.activity_log enable row level security;

-- Sites : visibles par leurs membres ; création réservée aux super-admins.
create policy sites_read on public.sites for select to authenticated
  using (public.is_platform_admin() or public.site_role_of(id) is not null);
create policy sites_write on public.sites for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy platform_admins_read on public.platform_admins for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- Membres : un administrateur voit son équipe et peut inviter éditeurs et contributeurs.
create policy members_read on public.site_members for select to authenticated
  using (user_id = auth.uid() or public.has_site_role(site_id, 'admin'));
create policy members_write_admin on public.site_members for all to authenticated
  using (public.is_platform_admin() or (public.has_site_role(site_id, 'admin') and role <> 'admin'))
  with check (public.is_platform_admin() or (public.has_site_role(site_id, 'admin') and role <> 'admin'));

-- Pages : lecture et écriture par les membres du site (le trigger protège les champs techniques).
create policy pages_read on public.pages for select to authenticated
  using (public.has_site_role(site_id, 'contributor'));
create policy pages_insert on public.pages for insert to authenticated
  with check (public.has_site_role(site_id, 'editor'));
create policy pages_update on public.pages for update to authenticated
  using (public.has_site_role(site_id, 'contributor'))
  with check (public.has_site_role(site_id, 'contributor'));
create policy pages_delete on public.pages for delete to authenticated
  using (public.is_platform_admin());

-- Versions : le public lit uniquement les versions publiées ; les membres lisent l'historique.
create policy versions_public on public.page_versions for select to anon, authenticated
  using (exists (select 1 from public.pages p where p.published_version_id = page_versions.id and p.deleted_at is null));
create policy versions_members on public.page_versions for select to authenticated
  using (public.has_site_role(site_id, 'contributor'));
create policy versions_insert on public.page_versions for insert to authenticated
  with check (public.has_site_role(site_id, 'editor') and created_by = auth.uid());

-- Réglages : publics en lecture (coordonnées, menus…) ; techniques modifiables par les super-admins seuls.
create policy settings_public on public.site_settings for select to anon, authenticated using (true);
create policy settings_write on public.site_settings for all to authenticated
  using (public.is_platform_admin() or (not technical and public.has_site_role(site_id, 'admin')))
  with check (public.is_platform_admin() or (not technical and public.has_site_role(site_id, 'admin')));

-- Redirections : lues par le site public, gérées par les super-admins
-- (les redirections automatiques sont créées par le serveur).
create policy redirects_public on public.redirects for select to anon, authenticated using (true);
create policy redirects_write on public.redirects for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Messages : envoyés par le formulaire public, lus et traités par les membres (sauf contributeurs).
create policy messages_insert on public.messages for insert to anon, authenticated
  with check (status = 'new');
create policy messages_read on public.messages for select to authenticated
  using (public.has_site_role(site_id, 'editor'));
create policy messages_update on public.messages for update to authenticated
  using (public.has_site_role(site_id, 'editor')) with check (public.has_site_role(site_id, 'editor'));

-- Journal : lecture par les administrateurs, écriture par tout membre pour ses propres actions.
create policy activity_read on public.activity_log for select to authenticated
  using (public.has_site_role(site_id, 'admin'));
create policy activity_insert on public.activity_log for insert to authenticated
  with check (user_id = auth.uid() and public.has_site_role(site_id, 'contributor'));
