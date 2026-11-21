-- Pulidos antes del APK (decisión del usuario): un usuario guiado puede tener hasta 3 hábitos
-- propios, más 1 por cada vez que un hábito de su plan sube de nivel. Aquí se cuentan esas subidas.
-- Al bajar de nivel no se resta. Con el límite del plan desbloqueado (90 días) ya no hay límite.

alter table public.user_settings add column if not exists subidas_plan integer not null default 0;
