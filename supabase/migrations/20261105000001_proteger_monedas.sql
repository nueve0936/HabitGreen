-- Habit Green: protección de monedas (SDD 6.1). Cierra el ciclo marcar, gastar, desmarcar y volver
-- a marcar, y el de marcar y eliminar. Reglas:
--   - Pago único por hábito y día: al desmarcar se devuelve lo que alcance. Si no se devolvió
--     completo, volver a marcar no paga y ese pago sigue contando para el tope diario.
--   - Eliminar también devuelve: borrar un hábito con monedas en esa fecha devuelve lo que alcance
--     y ese pago sigue contando para el tope. El registro y el XP se conservan.
--   - complete_habit rechaza hábitos en pausa o que no tocan esa fecha, y no da recompensas a una
--     fecha anterior a otro registro ya recibido (reloj del teléfono atrasado). La cola de
--     sincronización envía en orden, así que el uso normal sin conexión no se afecta.

alter table public.habit_logs
  add column monedas_sin_devolver boolean not null default false;

-- Pagos de monedas que cuentan para el tope del día: los activos y los que no se devolvieron.
create or replace function public.pagos_de_monedas_del_dia(p_user_id uuid, p_fecha date)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.habit_logs l
  where l.user_id = p_user_id and l.fecha = p_fecha
    and (l.monedas_sin_devolver or (l.monedas_otorgadas and l.eliminado_en is null))
$$;

-- Devuelve hasta p_monto monedas del saldo, sin bajar de 0. Regresa lo que sí se devolvió.
create or replace function public.devolver_monedas(
  p_user_id uuid,
  p_monto integer,
  p_ref_id uuid
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_saldo integer;
  v_devuelto integer;
begin
  select saldo into v_saldo from public.wallets where user_id = p_user_id;
  v_devuelto := least(coalesce(v_saldo, 0), p_monto);
  perform public.sumar_monedas(p_user_id, -v_devuelto, 'deshacer', p_ref_id);
  return v_devuelto;
end;
$$;

revoke all on function public.pagos_de_monedas_del_dia(uuid, date) from public, anon, authenticated;
revoke all on function public.devolver_monedas(uuid, integer, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- complete_habit. Devuelve {nuevo, xp, monedas, fase_anterior, fase}.
-- ---------------------------------------------------------------------------

create or replace function public.complete_habit(p_log_id uuid, p_habit_id uuid, p_fecha date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_config jsonb := public.config_recompensas();
  v_category_id uuid;
  v_activo boolean;
  v_log_id uuid;
  v_sin_devolver boolean;
  v_nivel integer;
  v_fases smallint[];
  v_fase_anterior smallint;
  v_fase smallint;
  v_con_recompensa boolean;
  v_xp boolean := false;
  v_monedas boolean := false;
begin
  if v_user_id is null then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  select h.category_id, h.activo into v_category_id, v_activo
  from public.habits h
  where h.id = p_habit_id and h.user_id = v_user_id and h.archivado_en is null;
  if v_category_id is null or not v_activo then
    raise exception 'habito_no_encontrado' using errcode = 'P0002';
  end if;

  perform public.validar_fecha_check_in(v_user_id, p_fecha);

  -- Debe tocar ese día: por su horario vigente o por una ocurrencia movida a esa fecha.
  if not (
    exists (
      select 1 from public.habit_schedules s
      where s.habit_id = p_habit_id
        and s.vigente_desde <= p_fecha
        and (s.vigente_hasta is null or s.vigente_hasta >= p_fecha)
        and extract(isodow from p_fecha)::smallint = any (s.dias_semana)
    )
    or exists (
      select 1 from public.habit_occurrences o
      where o.habit_id = p_habit_id and o.estado = 'movida' and o.fecha_nueva = p_fecha
    )
  ) then
    raise exception 'no_programado' using errcode = 'P0001';
  end if;

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
  returning id, monedas_sin_devolver into v_log_id, v_sin_devolver;

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

  -- Una fecha anterior a otro registro ya recibido se guarda, pero sin recompensas.
  v_con_recompensa := not exists (
    select 1 from public.habit_logs l
    where l.user_id = v_user_id and l.fecha > p_fecha
  );

  -- XP: tope de hábitos por planta al día y nivel máximo.
  if v_con_recompensa and v_nivel < (v_config ->> 'nivel_maximo')::int and (
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

  -- Monedas: pago único por hábito y día, y tope de hábitos al día.
  if v_con_recompensa and not v_sin_devolver
    and public.pagos_de_monedas_del_dia(v_user_id, p_fecha)
      < (v_config ->> 'tope_habitos_con_monedas_dia')::int then
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
-- uncomplete_habit. Devuelve {cambio, xp, monedas, fase_anterior, fase}.
-- ---------------------------------------------------------------------------

create or replace function public.uncomplete_habit(p_habit_id uuid, p_fecha date)
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
  v_devuelto integer;
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
  perform 1 from public.wallets where user_id = v_user_id for update;

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
    v_devuelto := public.devolver_monedas(v_user_id, v_monedas_por, v_log.id);

    if v_devuelto < v_monedas_por then
      -- No se devolvió completo: no vuelve a pagar hoy y el pago sigue contando para el tope.
      update public.habit_logs set monedas_sin_devolver = true where id = v_log.id;
    else
      -- Se devolvió completo: el lugar queda libre para quien se quedó sin monedas por el tope.
      v_otro := null;
      select l.id into v_otro
      from public.habit_logs l
      where l.user_id = v_user_id and l.fecha = p_fecha
        and l.eliminado_en is null and not l.monedas_otorgadas and not l.monedas_sin_devolver
      order by l.completado_en
      limit 1;
      if v_otro is not null then
        perform public.sumar_monedas(v_user_id, v_monedas_por, 'habito', v_otro);
        update public.habit_logs set monedas_otorgadas = true where id = v_otro;
      end if;
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
-- archivar_habito («Eliminar»): archiva y devuelve las monedas que ese hábito dio en esa fecha.
-- El registro y el XP se conservan. Devuelve {archivado, devuelto}.
-- ---------------------------------------------------------------------------

create or replace function public.archivar_habito(p_habit_id uuid, p_fecha date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_config jsonb := public.config_recompensas();
  v_log_id uuid;
  v_devuelto integer := 0;
  v_archivado boolean;
begin
  if v_user_id is null then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  -- La fecha no se valida: un borrado hecho sin conexión hace días no debe perderse. Solo sirve para
  -- buscar el registro de ese día, y devolver monedas nunca beneficia al usuario.
  perform 1 from public.wallets where user_id = v_user_id for update;

  update public.habits
  set archivado_en = now()
  where id = p_habit_id and user_id = v_user_id and archivado_en is null;
  v_archivado := found;

  if not v_archivado then
    if not exists (select 1 from public.habits h where h.id = p_habit_id and h.user_id = v_user_id) then
      raise exception 'habito_no_encontrado' using errcode = 'P0002';
    end if;
    -- Ya estaba archivado (operación reenviada): no se devuelve otra vez.
    return jsonb_build_object('archivado', false, 'devuelto', 0);
  end if;

  select l.id into v_log_id
  from public.habit_logs l
  where l.habit_id = p_habit_id and l.fecha = p_fecha and l.user_id = v_user_id
    and l.eliminado_en is null and l.monedas_otorgadas
  for update;

  if v_log_id is not null then
    v_devuelto := public.devolver_monedas(
      v_user_id, (v_config ->> 'monedas_por_habito')::int, v_log_id
    );
    update public.habit_logs
    set monedas_otorgadas = false, monedas_sin_devolver = true
    where id = v_log_id;
  end if;

  return jsonb_build_object('archivado', true, 'devuelto', v_devuelto);
end;
$$;

revoke all on function public.archivar_habito(uuid, date) from public, anon;
grant execute on function public.archivar_habito(uuid, date) to authenticated;
