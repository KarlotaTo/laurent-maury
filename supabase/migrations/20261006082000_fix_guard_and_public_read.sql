-- 1. Le contrôle des champs techniques s'exécute avec les droits de l'utilisateur
--    (sinon current_user vaut le propriétaire de la fonction et le verrou ne s'applique jamais).
alter function public.guard_page_technical_fields() security invoker;

-- 2. Le public lit les versions publiées sans avoir accès à la table des pages.
create or replace function public.is_published_version(p_version uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from pages where published_version_id = p_version and deleted_at is null);
$$;

drop policy versions_public on public.page_versions;
create policy versions_public on public.page_versions for select to anon, authenticated
  using (public.is_published_version(id));
