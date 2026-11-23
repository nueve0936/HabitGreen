// Esquema local de SQLite (SDD 3.4). Cada tabla es un espejo de su tabla en Supabase, con las
// columnas que usa la app. La misma descripción sirve para crear las tablas, convertir las filas
// que llegan del servidor y armar la descarga incremental, así que una columna se agrega aquí y
// nada más.
//
// SQLite no tiene booleanos ni arreglos: los booleanos se guardan como 0/1 y los arreglos y
// objetos (dias_semana, jsonb) como texto JSON.

export type TipoColumna = 'texto' | 'numero' | 'bool' | 'json';

export type TablaLocal = {
  nombre: string;
  /** Clave primaria local. En habit_logs es (habit_id, fecha), la restricción única del servidor. */
  clave: string[];
  columnas: Record<string, TipoColumna>;
  /** Columna de fecha para limitar la carga inicial a los últimos 365 días. */
  filtroFecha?: string;
};

const T = 'texto' as const;
const N = 'numero' as const;
const B = 'bool' as const;
const J = 'json' as const;

export const TABLAS = [
  {
    nombre: 'profiles',
    clave: ['id'],
    columnas: { id: T, nombre: T, zona_horaria: T, modo: T, onboarding_completo: B, updated_at: T },
  },
  {
    nombre: 'user_settings',
    clave: ['user_id'],
    columnas: {
      user_id: T,
      presupuesto_min: N,
      estilo_notificaciones: T,
      estrategias: J,
      horas_por_momento: J,
      segundo_aviso: B,
      ultima_evaluacion: T,
      limite_plan_desbloqueado: B,
      subidas_plan: N,
      planta_hoy: T,
      updated_at: T,
    },
  },
  {
    // Solo de bajada: el momento (P5) y el historial (P3) deciden algunos avisos (SDD 5.6 y 7.1).
    nombre: 'onboarding_answers',
    clave: ['id'],
    columnas: { id: T, user_id: T, respuestas: J, version_formulario: N, updated_at: T },
  },
  {
    nombre: 'app_config',
    clave: ['clave'],
    columnas: { clave: T, valor: J, updated_at: T },
  },
  {
    nombre: 'categories',
    clave: ['id'],
    columnas: { id: T, clave: T, nombre: T, es_sistema: B, user_id: T, updated_at: T },
  },
  {
    nombre: 'habit_catalog',
    clave: ['id'],
    columnas: {
      id: T,
      objetivo: T,
      categoria: T,
      nivel: N,
      variante: T,
      titulo: T,
      descripcion: T,
      duracion_min: N,
      duracion_reducida_min: N,
      dias_semana: J,
      momento_fijo: T,
      sin_recursos: B,
      updated_at: T,
    },
  },
  {
    nombre: 'plans',
    clave: ['id'],
    // Un plan por área (varios planes por usuario): sus respuestas de área, su revisión semanal y
    // su desbloqueo de 90 días.
    columnas: {
      id: T,
      user_id: T,
      origen: T,
      activo: B,
      area: T,
      respuestas: J,
      ultima_evaluacion: T,
      limite_desbloqueado: B,
      creado_en: T,
      updated_at: T,
    },
  },
  {
    nombre: 'habits',
    clave: ['id'],
    columnas: {
      id: T,
      user_id: T,
      category_id: T,
      plan_id: T,
      objetivo: T,
      nivel: N,
      usa_duracion_reducida: B,
      nivel_desde: T,
      titulo: T,
      descripcion: T,
      duracion_min: N,
      activo: B,
      archivado_en: T,
      created_at: T,
      updated_at: T,
    },
  },
  {
    nombre: 'habit_schedules',
    clave: ['id'],
    columnas: {
      id: T,
      habit_id: T,
      user_id: T,
      dias_semana: J,
      hora: T,
      flexible: B,
      notificar: B,
      vigente_desde: T,
      vigente_hasta: T,
      updated_at: T,
    },
  },
  {
    nombre: 'habit_occurrences',
    clave: ['id'],
    columnas: {
      id: T,
      habit_id: T,
      user_id: T,
      fecha_original: T,
      fecha_nueva: T,
      estado: T,
      creado_en: T,
      updated_at: T,
    },
  },
  {
    nombre: 'habit_logs',
    clave: ['habit_id', 'fecha'],
    filtroFecha: 'fecha',
    columnas: {
      id: T,
      habit_id: T,
      user_id: T,
      category_id: T,
      fecha: T,
      estado: T,
      completado_en: T,
      xp_otorgado: B,
      monedas_otorgadas: B,
      monedas_sin_devolver: B,
      updated_at: T,
      eliminado_en: T,
    },
  },
  {
    nombre: 'plant_progress',
    clave: ['user_id', 'category_id'],
    columnas: { user_id: T, category_id: T, xp: N, nivel: N, fase: N, updated_at: T },
  },
  {
    nombre: 'wallets',
    clave: ['user_id'],
    columnas: { user_id: T, saldo: N, updated_at: T },
  },
  {
    nombre: 'accessories',
    clave: ['id'],
    columnas: { id: T, tipo: T, nombre: T, precio: N, orden: N, imagen: T, updated_at: T },
  },
  {
    nombre: 'user_accessories',
    clave: ['id'],
    columnas: {
      id: T,
      user_id: T,
      accessory_id: T,
      categorias_equipadas: J,
      updated_at: T,
      eliminado_en: T,
    },
  },
] as const satisfies readonly TablaLocal[];

export type NombreTabla = (typeof TABLAS)[number]['nombre'];

export function tablaLocal(nombre: NombreTabla): TablaLocal {
  const tabla = TABLAS.find((t) => t.nombre === nombre);
  if (!tabla) throw new Error(`Tabla local desconocida: ${nombre}`);
  return tabla;
}

const TIPO_SQL: Record<TipoColumna, string> = {
  texto: 'TEXT',
  numero: 'REAL',
  bool: 'INTEGER',
  json: 'TEXT',
};

/** Sentencias CREATE TABLE de las tablas espejo. */
export function sqlTablasEspejo(): string {
  return TABLAS.map((tabla: TablaLocal) => {
    const columnas = Object.entries(tabla.columnas).map(([c, tipo]) => `${c} ${TIPO_SQL[tipo]}`);
    return `CREATE TABLE IF NOT EXISTS ${tabla.nombre} (${columnas.join(', ')}, PRIMARY KEY (${tabla.clave.join(', ')}));`;
  }).join('\n');
}

/**
 * Tablas propias de la app: cola de salida, cursores de sincronización y las tarjetas pendientes
 * de la progresión (SDD 6.3; solo viven en este teléfono, no se sincronizan).
 */
export const SQL_TABLAS_PROPIAS = `
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operacion TEXT NOT NULL,
  tabla TEXT NOT NULL,
  clave TEXT NOT NULL,
  payload TEXT NOT NULL,
  creado_en TEXT NOT NULL,
  intentos INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sync_state (tabla TEXT PRIMARY KEY, cursor TEXT);
CREATE TABLE IF NOT EXISTS progresion_tarjetas (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  orden INTEGER NOT NULL,
  json TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS habit_logs_fecha_idx ON habit_logs (fecha);
CREATE INDEX IF NOT EXISTS habit_schedules_habit_idx ON habit_schedules (habit_id);
`;

/** Clave de una fila en el formato de outbox.clave: los valores de la clave primaria unidos. */
export function claveDeFila(tabla: TablaLocal, fila: Record<string, unknown>): string {
  return tabla.clave.map((c) => String(fila[c])).join('|');
}

export type ValorLocal = string | number | null;

/** Un valor de la app (o de Supabase) en el formato de su columna de SQLite. */
export function valorLocal(tipo: TipoColumna, valor: unknown): ValorLocal {
  if (valor === undefined || valor === null) return null;
  switch (tipo) {
    case 'bool':
      return valor ? 1 : 0;
    case 'json':
      return JSON.stringify(valor);
    case 'numero':
      return Number(valor);
    default:
      return String(valor);
  }
}

/** Convierte una fila de Supabase (o armada por la app) al formato de SQLite. */
export function aValoresLocales(tabla: TablaLocal, fila: Record<string, unknown>): ValorLocal[] {
  return Object.entries(tabla.columnas).map(([columna, tipo]) => valorLocal(tipo, fila[columna]));
}

/** Lo contrario de aValoresLocales: una fila de SQLite con booleanos y JSON de vuelta. */
export function desdeValoresLocales<T>(tabla: TablaLocal, fila: Record<string, unknown>): T {
  const resultado: Record<string, unknown> = { ...fila };
  for (const [columna, tipo] of Object.entries(tabla.columnas)) {
    const valor = fila[columna];
    if (valor === undefined || valor === null) continue;
    if (tipo === 'bool') resultado[columna] = valor === 1 || valor === true;
    if (tipo === 'json' && typeof valor === 'string') resultado[columna] = JSON.parse(valor);
  }
  return resultado as T;
}

/** INSERT que reemplaza la fila si ya existe con la misma clave primaria. */
export function sqlUpsert(tabla: TablaLocal): string {
  const columnas = Object.keys(tabla.columnas);
  const marcas = columnas.map(() => '?').join(', ');
  return `INSERT OR REPLACE INTO ${tabla.nombre} (${columnas.join(', ')}) VALUES (${marcas})`;
}
