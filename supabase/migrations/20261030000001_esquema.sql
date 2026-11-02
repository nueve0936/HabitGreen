-- Habit Green: esquema completo del MVP (SDD 4).
-- Todas las tablas de usuario llevan user_id y RLS: cada usuario solo ve y edita sus filas.
-- Las tablas sincronizadas llevan updated_at (trigger) y, si se pueden quitar filas, eliminado_en
-- (borrado suave, SDD 3.4). Las escrituras de recompensas (habit_logs, plant_progress, wallets,
-- coin_transactions) solo se hacen desde RPC (Entrega 4), por eso no tienen políticas de escritura.

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catálogos del sistema
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  clave text not null,
  nombre text not null,
  es_sistema boolean not null default false,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_sistema_sin_usuario check (es_sistema = (user_id is null))
);
create unique index categories_clave_sistema_idx on public.categories (clave) where user_id is null;
create unique index categories_clave_usuario_idx on public.categories (user_id, clave) where user_id is not null;

create table public.habit_catalog (
  id uuid primary key default gen_random_uuid(),
  objetivo text not null,
  categoria text not null,
  nivel smallint not null check (nivel between 1 and 3),
  variante text not null default 'base' check (variante in ('base', 'sin_recursos')),
  titulo text not null,
  descripcion text,
  duracion_min integer not null check (duracion_min > 0),
  duracion_reducida_min integer not null check (duracion_reducida_min > 0),
  dias_semana smallint[] not null check (dias_semana <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[] and cardinality(dias_semana) > 0),
  momento_fijo text check (momento_fijo in ('manana', 'mediodia', 'tarde', 'noche')),
  sin_recursos boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (objetivo, nivel, variante),
  constraint habit_catalog_duracion_reducida check (duracion_reducida_min <= duracion_min)
);

create table public.accessories (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('sombrero', 'lentes', 'maceta')),
  nombre text not null,
  precio integer not null check (precio > 0),
  orden smallint not null check (orden between 1 and 5),
  imagen text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo, orden)
);

create table public.app_config (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Perfil y ajustes
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  zona_horaria text not null default 'UTC',
  modo text check (modo in ('tradicional', 'guiado')),
  onboarding_completo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  respuestas jsonb not null,
  version_formulario integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  presupuesto_min integer not null check (presupuesto_min > 0),
  estilo_notificaciones text not null check (
    estilo_notificaciones in ('resumen_nocturno', 'recordatorio_suave', 'recordatorio_y_animo', 'minimo')
  ),
  estrategias text[] not null default '{}',
  horas_por_momento jsonb,
  segundo_aviso boolean not null default false,
  ultima_evaluacion date,
  limite_plan_desbloqueado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Plan y hábitos (UUID generados en el cliente para crear sin conexión, SDD 3.4)
-- ---------------------------------------------------------------------------

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  origen text not null check (origen in ('ia', 'catalogo')),
  json_plan jsonb not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plans_user_idx on public.plans (user_id);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  plan_id uuid references public.plans (id),
  objetivo text,
  nivel smallint check (nivel between 1 and 3),
  usa_duracion_reducida boolean not null default false,
  titulo text not null,
  descripcion text,
  duracion_min integer not null check (duracion_min > 0),
  activo boolean not null default true,
  archivado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un hábito del plan siempre tiene objetivo y nivel; uno manual no tiene ninguno de los dos.
  constraint habits_plan_o_manual check ((objetivo is null) = (nivel is null))
);
create index habits_user_idx on public.habits (user_id);
create index habits_user_updated_idx on public.habits (user_id, updated_at);

-- La categoría se fija al crear el hábito y no cambia (definición 6).
create or replace function public.habits_categoria_fija()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.category_id is distinct from old.category_id then
    raise exception 'La categoría de un hábito no se puede cambiar';
  end if;
  return new;
end;
$$;

create trigger habits_categoria_fija
before update on public.habits
for each row execute function public.habits_categoria_fija();

create table public.habit_schedules (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  dias_semana smallint[] not null check (dias_semana <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[] and cardinality(dias_semana) > 0),
  hora time,
  flexible boolean not null default false,
  notificar boolean not null default true,
  vigente_desde date not null,
  vigente_hasta date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_schedules_hora_o_flexible check (flexible or hora is not null),
  constraint habit_schedules_vigencia check (vigente_hasta is null or vigente_hasta >= vigente_desde)
);
create index habit_schedules_habit_idx on public.habit_schedules (habit_id);
create index habit_schedules_user_updated_idx on public.habit_schedules (user_id, updated_at);

create table public.habit_occurrences (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  fecha_original date not null,
  fecha_nueva date,
  estado text not null check (estado in ('movida', 'descartada')),
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, fecha_original),
  constraint habit_occurrences_movida_con_fecha check ((estado = 'movida') = (fecha_nueva is not null))
);
create index habit_occurrences_user_updated_idx on public.habit_occurrences (user_id, updated_at);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  fecha date not null,
  estado text not null default 'hecho' check (estado = 'hecho'),
  completado_en timestamptz not null default now(),
  xp_otorgado boolean not null default false,
  monedas_otorgadas boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  eliminado_en timestamptz,
  unique (habit_id, fecha)
);
create index habit_logs_user_fecha_idx on public.habit_logs (user_id, fecha);
create index habit_logs_user_updated_idx on public.habit_logs (user_id, updated_at);

create table public.habit_places (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  nombre text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  radio_m integer not null check (radio_m between 100 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  eliminado_en timestamptz
);
create index habit_places_habit_idx on public.habit_places (habit_id);
create index habit_places_user_updated_idx on public.habit_places (user_id, updated_at);

-- ---------------------------------------------------------------------------
-- Recompensas
-- ---------------------------------------------------------------------------

create table public.plant_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  xp integer not null default 0 check (xp >= 0),
  nivel smallint not null default 0 check (nivel between 0 and 30),
  fase smallint not null default 1 check (fase between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  saldo integer not null default 0 check (saldo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  monto integer not null,
  motivo text not null,
  ref_id uuid,
  creado_en timestamptz not null default now()
);
create index coin_transactions_user_idx on public.coin_transactions (user_id, creado_en);

create table public.user_accessories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  accessory_id uuid not null references public.accessories (id),
  categoria_equipada uuid references public.categories (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  eliminado_en timestamptz,
  unique (user_id, accessory_id)
);
create index user_accessories_user_updated_idx on public.user_accessories (user_id, updated_at);

-- ---------------------------------------------------------------------------
-- IA
-- ---------------------------------------------------------------------------

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  funcion text not null check (funcion in ('generate-plan', 'adjust-plan')),
  estado text not null,
  tokens integer,
  creado_en timestamptz not null default now()
);
create index ai_requests_user_idx on public.ai_requests (user_id, creado_en);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'categories', 'habit_catalog', 'accessories', 'app_config', 'profiles', 'onboarding_answers',
    'user_settings', 'plans', 'habits', 'habit_schedules', 'habit_occurrences', 'habit_logs',
    'habit_places', 'plant_progress', 'wallets', 'user_accessories'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      tabla
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Alta de usuario: perfil, monedero y una planta por categoría del sistema
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.wallets (user_id) values (new.id);
  insert into public.plant_progress (user_id, category_id)
  select new.id, c.id from public.categories c where c.es_sistema;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.habit_catalog enable row level security;
alter table public.accessories enable row level security;
alter table public.app_config enable row level security;
alter table public.profiles enable row level security;
alter table public.onboarding_answers enable row level security;
alter table public.user_settings enable row level security;
alter table public.plans enable row level security;
alter table public.habits enable row level security;
alter table public.habit_schedules enable row level security;
alter table public.habit_occurrences enable row level security;
alter table public.habit_logs enable row level security;
alter table public.habit_places enable row level security;
alter table public.plant_progress enable row level security;
alter table public.wallets enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.user_accessories enable row level security;
alter table public.ai_requests enable row level security;

-- Catálogos: lectura para usuarios con sesión.
create policy "Lectura de categorías del sistema y propias" on public.categories
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "Lectura del catálogo" on public.habit_catalog
  for select to authenticated using (true);

create policy "Lectura de accesorios" on public.accessories
  for select to authenticated using (true);

create policy "Lectura de configuración" on public.app_config
  for select to authenticated using (true);

-- Perfil: se crea con el trigger; el usuario lo lee y lo edita.
create policy "Leer mi perfil" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Editar mi perfil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Tablas editables por su dueño (sin borrado: se archiva o se usa eliminado_en).
create policy "Leer mis respuestas" on public.onboarding_answers
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Crear mis respuestas" on public.onboarding_answers
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Editar mis respuestas" on public.onboarding_answers
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Leer mis ajustes" on public.user_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Crear mis ajustes" on public.user_settings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Editar mis ajustes" on public.user_settings
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Leer mis planes" on public.plans
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Crear mis planes" on public.plans
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Editar mis planes" on public.plans
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Leer mis hábitos" on public.habits
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Crear mis hábitos" on public.habits
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.categories c
      where c.id = category_id and (c.user_id is null or c.user_id = (select auth.uid()))
    )
    and (plan_id is null or exists (
      select 1 from public.plans p where p.id = plan_id and p.user_id = (select auth.uid())
    ))
  );
create policy "Editar mis hábitos" on public.habits
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Tablas hijas de un hábito: el hábito también debe ser del usuario.
create policy "Leer mis horarios" on public.habit_schedules
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Crear mis horarios" on public.habit_schedules
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );
create policy "Editar mis horarios" on public.habit_schedules
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Leer mis ocurrencias" on public.habit_occurrences
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Crear mis ocurrencias" on public.habit_occurrences
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );
create policy "Editar mis ocurrencias" on public.habit_occurrences
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Leer mis lugares" on public.habit_places
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Crear mis lugares" on public.habit_places
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );
create policy "Editar mis lugares" on public.habit_places
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Recompensas: solo lectura desde la app; se escriben con las RPC (Entrega 4).
create policy "Leer mis registros" on public.habit_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Leer mis plantas" on public.plant_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Leer mi monedero" on public.wallets
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Leer mis movimientos" on public.coin_transactions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Leer mis accesorios" on public.user_accessories
  for select to authenticated using (user_id = (select auth.uid()));
-- Equipar o quitar un accesorio comprado (la compra será una RPC).
create policy "Equipar mis accesorios" on public.user_accessories
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Uso de IA: solo lectura; la Edge Function escribe con la clave de servicio.
create policy "Leer mi uso de IA" on public.ai_requests
  for select to authenticated using (user_id = (select auth.uid()));
