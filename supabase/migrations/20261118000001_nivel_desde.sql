-- Progresión (SDD 6.3, Entrega 8): fecha del último cambio de nivel de un hábito del plan.
-- El cumplimiento de la siguiente revisión solo cuenta desde ese día (decisión del usuario), para
-- que los días del nivel anterior no decidan el siguiente cambio. Nula = nunca cambió de nivel.

alter table public.habits add column if not exists nivel_desde date;
