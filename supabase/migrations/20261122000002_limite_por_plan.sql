-- Varios planes, fase 5 (decisión del usuario del 20 nov): cada plan tiene hasta 3 hábitos activos
-- (antes 4). Los planes se ganan con las subidas y los hábitos propios tienen su límite aparte; esas
-- reglas viven en la app (src/features/habits/domain/limite-habitos.ts).
update public.app_config
set valor = jsonb_set(valor, '{limite_habitos_plan}', '3'::jsonb)
where clave = 'progresion';
