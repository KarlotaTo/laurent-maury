-- Les administrateurs d'un site gèrent ses redirections (et plus seulement la super-admin).
drop policy redirects_write on public.redirects;
create policy redirects_write on public.redirects for all to authenticated
  using (public.has_site_role(site_id, 'admin'))
  with check (public.has_site_role(site_id, 'admin'));

alter table public.redirects add column if not exists note text check (char_length(note) <= 200);
