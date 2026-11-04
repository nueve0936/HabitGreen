-- Habit Green: hábitos sin recordatorio (rediseño de Crear hábito). Antes todo horario necesitaba
-- una hora o ser flexible; ahora un horario con notificar = false puede no tener hora (la fila
-- «Recordatorios: Ninguno» del asistente).

alter table public.habit_schedules
  drop constraint habit_schedules_hora_o_flexible;

alter table public.habit_schedules
  add constraint habit_schedules_hora_o_flexible
  check (flexible or hora is not null or not notificar);
