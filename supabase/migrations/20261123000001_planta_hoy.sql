-- Planta que se ve en Hoy (decisión del usuario del 22 nov): se elige con «Equipar» en Detalles de
-- la planta. Null = la automática (la de fase más alta). Se sincroniza como los demás ajustes.
alter table public.user_settings
  add column if not exists planta_hoy text null
  check (planta_hoy in ('salud_fisica', 'trabajo', 'salud_mental', 'finanzas', 'social'));
