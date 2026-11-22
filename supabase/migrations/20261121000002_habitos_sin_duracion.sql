-- Hábitos sin duración (decisión del usuario, 20 nov): los que no consisten en hacer algo durante
-- un tiempo (tomar agua, anotar un gasto, enviar un mensaje…) son recordatorios: duran 0 minutos y
-- no gastan del tiempo diario. Los que sí son de tiempo conservan sus minutos aproximados y el
-- usuario los puede editar. Ahora también un hábito del plan puede quedar sin duración.

alter table public.habit_catalog drop constraint if exists habit_catalog_duracion_min_check;
alter table public.habit_catalog drop constraint if exists habit_catalog_duracion_reducida_min_check;
alter table public.habit_catalog add constraint habit_catalog_duracion_min_check
  check (duracion_min >= 0);
alter table public.habit_catalog add constraint habit_catalog_duracion_reducida_min_check
  check (duracion_reducida_min >= 0);

alter table public.habits drop constraint if exists habits_duracion_min_check;
alter table public.habits add constraint habits_duracion_min_check check (duracion_min >= 0);

-- Filas del catálogo sin duración (lista validada por el usuario).
update public.habit_catalog
set duracion_min = 0, duracion_reducida_min = 0
where (objetivo, nivel) in (
  ('dormir_mejor', 1),
  ('comer_mejor', 1),
  ('comer_mejor', 2),
  ('tomar_agua', 1),
  ('tomar_agua', 2),
  ('tomar_agua', 3),
  ('organizar_dia', 1),
  ('organizar_dia', 2),
  ('saber_gastos', 1),
  ('saber_gastos', 2),
  ('saber_gastos', 3),
  ('empezar_ahorrar', 1),
  ('empezar_ahorrar', 2),
  ('empezar_ahorrar', 3),
  ('evitar_impulsivas', 1),
  ('evitar_impulsivas', 2),
  ('evitar_impulsivas', 3),
  ('mantener_contacto', 1),
  ('mantener_contacto', 2),
  ('conocer_gente', 1),
  ('conocer_gente', 2)
);

-- «Elegir una opción con verdura al comer fuera» (variante sin recursos); la base, «Preparar una
-- comida casera», conserva sus minutos.
update public.habit_catalog
set duracion_min = 0, duracion_reducida_min = 0
where objetivo = 'comer_mejor' and nivel = 3 and variante = 'sin_recursos';

-- «Hora fija para acostarme y rutina de 20 min» se separa: queda solo la hora fija, sin duración.
update public.habit_catalog
set titulo = 'Hora fija para acostarme', duracion_min = 0, duracion_reducida_min = 0
where objetivo = 'dormir_mejor' and nivel = 3;

-- Hábitos del plan que ya existen en esos niveles: quedan sin duración (los títulos no se tocan).
-- Comer mejor nivel 3 se omite porque no se sabe de qué variante salió.
update public.habits h
set duracion_min = 0, usa_duracion_reducida = false
where h.plan_id is not null
  and h.archivado_en is null
  and not (h.objetivo = 'comer_mejor' and h.nivel = 3)
  and exists (
    select 1 from public.habit_catalog c
    where c.objetivo = h.objetivo and c.nivel = h.nivel and c.duracion_min = 0
  );
