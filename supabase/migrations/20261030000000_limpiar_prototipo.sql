-- Habit Green: elimina el esquema del prototipo anterior (migración remota 20261002000000) para
-- dejar solo el esquema del SDD. Sus datos eran de prueba. Es idempotente: en una base nueva no
-- hace nada.

drop function if exists public.accept_plan(uuid, jsonb);

drop table if exists public.programaciones cascade;
drop table if exists public.habitos cascade;
drop table if exists public.planes_ia cascade;
drop table if exists public.perfil_contexto cascade;
drop table if exists public.categorias cascade;
