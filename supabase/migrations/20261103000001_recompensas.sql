-- Habit Green: recompensas (Entrega 4, SDD 6.1 y 6.4). Reemplaza las RPC mínimas de check-in
-- de la Entrega 3 por las completas: XP por planta y monedas con sus topes diarios, y agrega la
-- compra de accesorios. Las constantes salen de app_config ('recompensas'); aquí no hay números
-- de negocio.
--
-- Cada RPC bloquea el monedero del usuario (for update) al empezar: así dos check-ins que llegan
-- juntos se aplican uno detrás de otro y los topes no se cuentan doble.

create or replace function public.config_recompensas()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select valor from public.app_config where clave = 'recompensas'
$$;

create or replace function public.fase_de_nivel(p_nivel integer, p_config jsonb)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select (case
    when p_nivel >= (p_config ->> 'nivel_inicio_fase_3')::int then 3
    when p_nivel >= (p_config ->> 'nivel_inicio_fase_2')::int then 2
    else 1
  end)::smallint
$$;

-- Suma (o resta, con p_delta negativo) XP a una planta y recalcula nivel y fase.
-- Devuelve {fase_anterior, fase}.
create or replace function public.sumar_xp_planta(
  p_user_id uuid,
  p_category_id uuid,
  p_delta integer,
  p_config jsonb
)
returns smallint[]
language plpgsql
set search_path = ''
as $$
declare
  v_xp integer;
  v_fase_anterior smallint;
  v_nivel integer;
begin
  select xp, fase into v_xp, v_fase_anterior
  from public.plant_progress
  where user_id = p_user_id and category_id = p_category_id
  for update;

  if not found then
    insert into public.plant_progress (user_id, category_id) values (p_user_id, p_category_id);
    v_xp := 0;
    v_fase_anterior := 1;
  end if;

  v_xp := greatest(0, v_xp + p_delta);
  v_nivel := least((p_config ->> 'nivel_maximo')::int, v_xp / (p_config ->> 'xp_por_nivel')::int);

  update public.plant_progress
  set xp = v_xp, nivel = v_nivel, fase = public.fase_de_nivel(v_nivel, p_config)
  where user_id = p_user_id and category_id = p_category_id;

  return array[v_fase_anterior, public.fase_de_nivel(v_nivel, p_config)];
end;
$$;

-- Suma monedas al monedero y deja el movimiento en coin_transactions.
create or replace function public.sumar_monedas(
  p_user_id uuid,
  p_monto integer,
  p_motivo text,
  p_ref_id uuid
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_monto = 0 then
    return;
  end if;
  update public.wallets set saldo = saldo + p_monto where user_id = p_user_id;
  insert into public.coin_transactions (user_id, monto, motivo, ref_id)
  values (p_user_id, p_monto, p_motivo, p_ref_id);
end;
$$;

revoke all on function public.config_recompensas() from public, anon, authenticated;
revoke all on function public.fase_de_nivel(integer, jsonb) from public, anon, authenticated;
revoke all on function public.sumar_xp_planta(uuid, uuid, integer, jsonb) from public, anon, authenticated;
revoke all on function public.sumar_monedas(uuid, integer, text, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- complete_habit: registra el check-in y otorga XP y monedas según los topes (SDD 6.1).
-- Devuelve {nuevo, xp, monedas, fase_anterior, fase}.
-- ---------------------------------------------------------------------------

drop function if exists public.complete_habit(uuid, uuid, date);

create function public.complete_habit(p_log_id uuid, p_habit_id uuid, p_fecha date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_config jsonb := public.config_recompensas();
  v_category_id uuid;
  v_log_id uuid;
  v_nivel integer;
  v_fases smallint[];
  v_fase_anterior smallint;
  v_fase smallint;
  v_xp boolean := false;
  v_monedas boolean := false;
begin
  if v_user_id is null then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  select h.category_id into v_category_id
  from public.habits h
  where h.id = p_habit_id and h.user_id = v_user_id and h.archivado_en is null;
  if v_category_id is null then
    raise exception 'habito_no_encontrado' using errcode = 'P0002';
  end if;

  perform public.validar_fecha_check_in(v_user_id, p_fecha);
  perform 1 from public.wallets where user_id = v_user_id for update;

  select nivel, fase into v_nivel, v_fase_anterior
  from public.plant_progress
  where user_id = v_user_id and category_id = v_category_id;
  v_nivel := coalesce(v_nivel, 0);
  v_fase_anterior := coalesce(v_fase_anterior, 1);
  v_fase := v_fase_anterior;

  insert into public.habit_logs (id, habit_id, user_id, category_id, fecha)
  values (p_log_id, p_habit_id, v_user_id, v_category_id, p_fecha)
  on conflict (habit_id, fecha) do update
    set eliminado_en = null,
        completado_en = now(),
        xp_otorgado = false,
        monedas_otorgadas = false
    where public.habit_logs.eliminado_en is not null
  returning id into v_log_id;

  -- Ya estaba completado (la cola reenvió la operación): no se otorga nada otra vez.
  if v_log_id is null then
    select l.xp_otorgado, l.monedas_otorgadas into v_xp, v_monedas
    from public.habit_logs l
    where l.habit_id = p_habit_id and l.fecha = p_fecha;
    return jsonb_build_object(
      'nuevo', false, 'xp', v_xp, 'monedas', v_monedas,
      'fase_anterior', v_fase_anterior, 'fase', v_fase
    );
  end if;

  -- XP: tope de hábitos por planta al día y nivel máximo.
  if v_nivel < (v_config ->> 'nivel_maximo')::int and (
    select count(*) from public.habit_logs l
    where l.user_id = v_user_id and l.category_id = v_category_id and l.fecha = p_fecha
      and l.eliminado_en is null and l.xp_otorgado
  ) < (v_config ->> 'tope_habitos_con_xp_por_planta_dia')::int then
    v_fases := public.sumar_xp_planta(
      v_user_id, v_category_id, (v_config ->> 'xp_por_habito')::int, v_config
    );
    v_fase_anterior := v_fases[1];
    v_fase := v_fases[2];
    v_xp := true;
  end if;

  -- Monedas: tope de hábitos al día.
  if (
    select count(*) from public.habit_logs l
    where l.user_id = v_user_id and l.fecha = p_fecha
      and l.eliminado_en is null and l.monedas_otorgadas
  ) < (v_config ->> 'tope_habitos_con_monedas_dia')::int then
    perform public.sumar_monedas(
      v_user_id, (v_config ->> 'monedas_por_habito')::int, 'habito', v_log_id
    );
    v_monedas := true;
  end if;

  update public.habit_logs
  set xp_otorgado = v_xp, monedas_otorgadas = v_monedas
  where id = v_log_id;

  return jsonb_build_object(
    'nuevo', true, 'xp', v_xp, 'monedas', v_monedas,
    'fase_anterior', v_fase_anterior, 'fase', v_fase
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- uncomplete_habit: deshace el check-in y revierte lo que otorgó. Si otro registro del mismo día
-- se había quedado sin XP o sin monedas por el tope, ahora los recibe. Las monedas nunca dejan el
-- saldo por debajo de 0 (si ya se gastaron, se quita solo lo que hay).
-- Devuelve {cambio, xp, monedas, fase_anterior, fase}.
-- ---------------------------------------------------------------------------

drop function if exists public.uncomplete_habit(uuid, date);

create function public.uncomplete_habit(p_habit_id uuid, p_fecha date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_config jsonb := public.config_recompensas();
  v_monedas_por integer := (v_config ->> 'monedas_por_habito')::int;
  v_xp_por integer := (v_config ->> 'xp_por_habito')::int;
  v_log record;
  v_otro uuid;
  v_saldo integer;
  v_fase_anterior smallint;
  v_fase smallint;
begin
  if v_user_id is null then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  if not exists (select 1 from public.habits h where h.id = p_habit_id and h.user_id = v_user_id) then
    raise exception 'habito_no_encontrado' using errcode = 'P0002';
  end if;

  perform public.validar_fecha_check_in(v_user_id, p_fecha);
  select saldo into v_saldo from public.wallets where user_id = v_user_id for update;

  select l.id, l.category_id, l.xp_otorgado, l.monedas_otorgadas into v_log
  from public.habit_logs l
  where l.habit_id = p_habit_id and l.fecha = p_fecha and l.user_id = v_user_id
    and l.eliminado_en is null
  for update;

  -- Ya estaba deshecho (operación reenviada): no hay nada que revertir.
  if not found then
    return jsonb_build_object('cambio', false);
  end if;

  select fase into v_fase_anterior
  from public.plant_progress
  where user_id = v_user_id and category_id = v_log.category_id;

  update public.habit_logs
  set eliminado_en = now(), xp_otorgado = false, monedas_otorgadas = false
  where id = v_log.id;

  if v_log.xp_otorgado then
    perform public.sumar_xp_planta(v_user_id, v_log.category_id, -v_xp_por, v_config);

    select l.id into v_otro
    from public.habit_logs l
    where l.user_id = v_user_id and l.category_id = v_log.category_id and l.fecha = p_fecha
      and l.eliminado_en is null and not l.xp_otorgado
    order by l.completado_en
    limit 1;
    if v_otro is not null then
      perform public.sumar_xp_planta(v_user_id, v_log.category_id, v_xp_por, v_config);
      update public.habit_logs set xp_otorgado = true where id = v_otro;
    end if;
  end if;

  if v_log.monedas_otorgadas then
    perform public.sumar_monedas(
      v_user_id, -least(coalesce(v_saldo, 0), v_monedas_por), 'deshacer', v_log.id
    );

    v_otro := null;
    select l.id into v_otro
    from public.habit_logs l
    where l.user_id = v_user_id and l.fecha = p_fecha
      and l.eliminado_en is null and not l.monedas_otorgadas
    order by l.completado_en
    limit 1;
    if v_otro is not null then
      perform public.sumar_monedas(v_user_id, v_monedas_por, 'habito', v_otro);
      update public.habit_logs set monedas_otorgadas = true where id = v_otro;
    end if;
  end if;

  select fase into v_fase
  from public.plant_progress
  where user_id = v_user_id and category_id = v_log.category_id;

  return jsonb_build_object(
    'cambio', true, 'xp', v_log.xp_otorgado, 'monedas', v_log.monedas_otorgadas,
    'fase_anterior', coalesce(v_fase_anterior, 1), 'fase', coalesce(v_fase, 1)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- comprar_accesorio (SDD 6.4): solo con conexión. Si el accesorio ya es del usuario no cobra otra
-- vez (la petición se puede reintentar). Sin saldo suficiente: error 'saldo_insuficiente'.
-- Devuelve {comprado, saldo}.
-- ---------------------------------------------------------------------------

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
    set eliminado_en = null, categoria_equipada = null;

  perform public.sumar_monedas(v_user_id, -v_precio, 'compra', p_accessory_id);

  return jsonb_build_object('comprado', true, 'saldo', v_saldo - v_precio);
end;
$$;

revoke all on function public.complete_habit(uuid, uuid, date) from public, anon;
grant execute on function public.complete_habit(uuid, uuid, date) to authenticated;
revoke all on function public.uncomplete_habit(uuid, date) from public, anon;
grant execute on function public.uncomplete_habit(uuid, date) to authenticated;
revoke all on function public.comprar_accesorio(uuid) from public, anon;
grant execute on function public.comprar_accesorio(uuid) to authenticated;
