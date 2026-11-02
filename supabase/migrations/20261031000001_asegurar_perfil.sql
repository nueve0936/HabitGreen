-- Habit Green: la app puede recrear el perfil del usuario con sesión si falta (por ejemplo,
-- si se borraron filas de profiles a mano durante las pruebas). Crea perfil, monedero y una
-- planta por categoría del sistema, sin duplicar lo que ya exista.

create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  insert into public.profiles (id) values (v_user_id) on conflict (id) do nothing;
  insert into public.wallets (user_id) values (v_user_id) on conflict (user_id) do nothing;
  insert into public.plant_progress (user_id, category_id)
  select v_user_id, c.id from public.categories c where c.es_sistema
  on conflict (user_id, category_id) do nothing;
end;
$$;

revoke all on function public.ensure_profile() from public, anon;
grant execute on function public.ensure_profile() to authenticated;

-- Repara de una vez las cuentas que hoy no tienen perfil.
insert into public.profiles (id)
select u.id from auth.users u
on conflict (id) do nothing;

insert into public.wallets (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

insert into public.plant_progress (user_id, category_id)
select u.id, c.id
from auth.users u
cross join public.categories c
where c.es_sistema
on conflict (user_id, category_id) do nothing;
