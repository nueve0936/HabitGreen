-- Pulidos antes del APK (decisión del usuario): un mismo objeto puede llevarlo más de una planta a
-- la vez. Cada planta sigue con máximo uno de cada tipo (la app lo cuida al equipar). La planta
-- única (categoria_equipada) pasa a ser una lista de plantas (categorias_equipadas).

alter table public.user_accessories
  add column if not exists categorias_equipadas uuid[] not null default '{}';

update public.user_accessories
set categorias_equipadas = array[categoria_equipada]
where categoria_equipada is not null and categorias_equipadas = '{}';

alter table public.user_accessories drop column if exists categoria_equipada;

-- Igual que en 20261103000001_recompensas.sql; solo cambia que al recomprar se vacía la lista.
create or replace function public.comprar_accesorio(p_accessory_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_precio integer;
  v_saldo integer;
begin
  if v_user_id is null then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  select a.precio into v_precio from public.accessories a where a.id = p_accessory_id;
  if v_precio is null then
    raise exception 'accesorio_no_encontrado' using errcode = 'P0002';
  end if;

  select saldo into v_saldo from public.wallets where user_id = v_user_id for update;

  if exists (
    select 1 from public.user_accessories ua
    where ua.user_id = v_user_id and ua.accessory_id = p_accessory_id and ua.eliminado_en is null
  ) then
    return jsonb_build_object('comprado', false, 'saldo', v_saldo);
  end if;

  if coalesce(v_saldo, 0) < v_precio then
    raise exception 'saldo_insuficiente' using errcode = 'P0001';
  end if;

  insert into public.user_accessories (user_id, accessory_id)
  values (v_user_id, p_accessory_id)
  on conflict (user_id, accessory_id) do update
    set eliminado_en = null, categorias_equipadas = '{}';

  perform public.sumar_monedas(v_user_id, -v_precio, 'compra', p_accessory_id);

  return jsonb_build_object('comprado', true, 'saldo', v_saldo - v_precio);
end;
$$;

revoke all on function public.comprar_accesorio(uuid) from public, anon;
grant execute on function public.comprar_accesorio(uuid) to authenticated;
