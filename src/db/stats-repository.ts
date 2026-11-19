import type {
  Habito,
  Horario,
  Ocurrencia,
  Registro,
} from '@/features/habits/domain/habitos-del-dia';
import type { DatosEstadisticas } from '@/features/stats/domain/cumplimiento';

import { getDb, leerFilas } from './database';
import { categoriasPorId } from './habits-repository';
import { leerAjustesEn } from './settings-repository';

// Progreso (SDD 8): todo sale de SQLite, así que funciona sin conexión. Se leen también los
// hábitos archivados, porque su historial sigue contando en los periodos pasados. La carga
// inicial baja los registros de los últimos 365 días.

export type DatosProgreso = DatosEstadisticas & {
  /** Con `desanimo` solo se muestra la mejor racha. */
  desanimo: boolean;
};

export async function leerDatosEstadisticas(userId: string): Promise<DatosProgreso> {
  const db = await getDb();
  const [habitos, horarios, ocurrencias, registros, categorias, ajustes] = await Promise.all([
    leerFilas<Habito>(db, 'habits', '1 = 1 ORDER BY created_at'),
    leerFilas<Horario>(db, 'habit_schedules'),
    leerFilas<Ocurrencia>(db, 'habit_occurrences'),
    leerFilas<Registro>(db, 'habit_logs', 'eliminado_en IS NULL'),
    categoriasPorId(db),
    leerAjustesEn(db, userId),
  ]);
  return {
    habitos,
    horarios,
    ocurrencias,
    registros,
    categorias,
    desanimo: ajustes?.estrategias.includes('desanimo') ?? false,
  };
}
