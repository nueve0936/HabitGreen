-- Duración libre (Entrega 5): un hábito propio puede quedar «Sin definir» (0 minutos). Los del plan
-- siempre tienen duración, porque la progresión sube o baja de nivel con esos minutos (SDD 6.5).
-- Solo cambia la regla: no toca datos.

alter table public.habits drop constraint if exists habits_duracion_min_check;
alter table public.habits add constraint habits_duracion_min_check
  check (duracion_min > 0 or (duracion_min = 0 and plan_id is null));
