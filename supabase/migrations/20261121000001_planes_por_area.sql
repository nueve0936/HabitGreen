-- Varios planes por usuario (decisión del usuario, 20 nov): un plan por área, con su propia
-- revisión semanal y su desbloqueo de 90 días. Las respuestas del formulario que son del área
-- (P1 área, P2 objetivos, P3 historial) viven en el plan; las globales (P4–P7) siguen en
-- onboarding_answers. El tiempo diario sigue siendo uno solo (user_settings.presupuesto_min).

alter table public.plans
  add column if not exists area text
    check (area in ('salud_fisica', 'trabajo', 'salud_mental', 'finanzas', 'social')),
  add column if not exists respuestas jsonb,
  add column if not exists ultima_evaluacion date,
  add column if not exists limite_desbloqueado boolean not null default false;

-- Datos que ya existen: cada plan activo se parte en un plan por cada área de sus hábitos. La
-- revisión y el desbloqueo que eran del usuario se copian a cada plan. Un plan activo sin hábitos
-- queda inactivo.
do $$
declare
  p record;
  a record;
  primera boolean;
  destino uuid;
  resp jsonb;
  ajustes record;
begin
  for p in
    select * from public.plans where activo and area is null order by creado_en
  loop
    select o.respuestas into resp from public.onboarding_answers o where o.user_id = p.user_id;
    select s.ultima_evaluacion, s.limite_plan_desbloqueado into ajustes
    from public.user_settings s where s.user_id = p.user_id;
    primera := true;

    for a in
      select c.clave as clave, min(h.created_at) as desde
      from public.habits h
      join public.categories c on c.id = h.category_id
      where h.plan_id = p.id
      group by c.clave
      order by min(h.created_at)
    loop
      if primera then
        destino := p.id;
        primera := false;
      else
        destino := gen_random_uuid();
        insert into public.plans (id, user_id, origen, json_plan, activo, creado_en)
        values (destino, p.user_id, p.origen, p.json_plan, true, p.creado_en);
        update public.habits h
        set plan_id = destino
        from public.categories c
        where c.id = h.category_id and h.plan_id = p.id and c.clave = a.clave;
      end if;

      update public.plans pl
      set area = a.clave,
          ultima_evaluacion = ajustes.ultima_evaluacion,
          limite_desbloqueado = coalesce(ajustes.limite_plan_desbloqueado, false),
          respuestas = jsonb_build_object(
            'areas', jsonb_build_array(a.clave),
            'objetivos', coalesce(
              (select jsonb_agg(distinct h.objetivo)
               from public.habits h
               join public.categories c on c.id = h.category_id
               where h.plan_id = destino and c.clave = a.clave and h.objetivo is not null),
              '[]'::jsonb
            ),
            'historial', resp -> 'historial'
          )
      where pl.id = destino;
    end loop;

    if primera then
      update public.plans set activo = false where id = p.id;
    end if;
  end loop;
end;
$$;

-- Si una cuenta tenía dos planes activos de la misma área (hizo el formulario dos veces), se queda
-- el más nuevo: los hábitos del otro pasan a él y el otro queda inactivo.
do $$
declare
  d record;
begin
  for d in
    select pl.id, pl.user_id, pl.area,
      first_value(pl.id) over (
        partition by pl.user_id, pl.area order by pl.creado_en desc, pl.id desc
      ) as nuevo
    from public.plans pl
    where pl.activo and pl.area is not null
  loop
    if d.id <> d.nuevo then
      update public.habits set plan_id = d.nuevo where plan_id = d.id;
      update public.plans set activo = false where id = d.id;
    end if;
  end loop;
end;
$$;

-- Un solo plan activo por área.
create unique index if not exists plans_un_plan_por_area
  on public.plans (user_id, area)
  where activo and area is not null;
