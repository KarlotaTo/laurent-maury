-- Les écritures du serveur (rôle de service) ne sont pas soumises aux verrous de l'interface.
create or replace function public.guard_page_technical_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Le serveur (clé de service) et les super-admins écrivent librement :
  -- le serveur vérifie lui-même les droits avant d'agir.
  if current_user not in ('authenticated', 'anon') or public.is_platform_admin() then
    if tg_op = 'UPDATE' then
      new.updated_at := now();
    end if;
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
