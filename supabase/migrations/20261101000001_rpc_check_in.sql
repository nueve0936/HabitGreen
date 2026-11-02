-- Habit Green: check-in desde la app (Entrega 3). habit_logs no tiene políticas de escritura;
-- se escribe solo con estas RPC. Versión mínima: registran y deshacen el check-in, sin XP ni
-- monedas. La Entrega 4 las reemplaza con los topes (SDD 6.1) sin cambiar sus parámetros.
--
-- Las dos son idempotentes, porque la cola de sincronización puede reenviar una operación:
-- completar de nuevo reutiliza la fila (único por habit_id + fecha) y limpia eliminado_en;
-- deshacer es un borrado suave, para que la descarga incremental lo propague (SDD 3.4).
-- Aceptan fechas de hoy y de hasta 7 días atrás en la zona horaria del perfil.

create or replace function public.validar_fecha_check_in(p_user_id uuid, p_fecha date)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_hoy date;
begin
  select (now() at time zone p.zona_horaria)::date into v_hoy
  from public.profiles p
  where p.id = p_user_id;

  if v_hoy is null or p_fecha > v_hoy or p_fecha < v_hoy - 7 then
    raise exception 'fecha_fuera_de_rango' using errcode = '22008';
  end if;
end;
$$;

revoke all on function public.validar_fecha_check_in(uuid, date) from public, anon, authenticated;

create or replace function public.complete_habit(p_log_id uuid, p_habit_id uuid, p_fecha date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_category_id uuid;
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

  insert into public.habit_logs (id, habit_id, user_id, category_id, fecha)
  values (p_log_id, p_habit_id, v_user_id, v_category_id, p_fecha)
  on conflict (habit_id, fecha) do update
    set eliminado_en = null,
        completado_en = now()
    where public.habit_logs.eliminado_en is not null;
end;
$$;

create or replace function public.uncomplete_habit(p_habit_id uuid, p_fecha date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  if not exists (select 1 from public.habits h where h.id = p_habit_id and h.user_id = v_user_id) then
    raise exception 'habito_no_encontrado' using errcode = 'P0002';
  end if;

  perform public.validar_fecha_check_in(v_user_id, p_fecha);

  update public.habit_logs
  set eliminado_en = now()
  where habit_id = p_habit_id and fecha = p_fecha and user_id = v_user_id and eliminado_en is null;
end;
$$;

revoke all on function public.complete_habit(uuid, uuid, date) from public, anon;
grant execute on function public.complete_habit(uuid, uuid, date) to authenticated;
revoke all on function public.uncomplete_habit(uuid, date) from public, anon;
grant execute on function public.uncomplete_habit(uuid, date) to authenticated;
