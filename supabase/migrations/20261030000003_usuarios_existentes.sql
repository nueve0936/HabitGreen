-- Habit Green: crea perfil, monedero y plantas para las cuentas que ya existían antes del
-- trigger on_auth_user_created (por ejemplo, las creadas antes de aplicar las migraciones).
-- Es idempotente: no duplica nada si se vuelve a ejecutar.

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
