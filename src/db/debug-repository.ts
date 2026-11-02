import { getDb } from './database';

// Conteos para el panel temporal de Perfil (prueba de la Entrega 3, parte 1). Se quita cuando
// Hoy y Hábitos muestren los datos locales.

export type ConteoLocal = {
  habitos: number;
  horarios: number;
  registros: number;
  pendientes: number;
};

export async function contarDatosLocales(): Promise<ConteoLocal> {
  const db = await getDb();
  const contar = async (sql: string) => (await db.getFirstAsync<{ n: number }>(sql))?.n ?? 0;
  return {
    habitos: await contar('SELECT COUNT(*) AS n FROM habits WHERE archivado_en IS NULL'),
    horarios: await contar('SELECT COUNT(*) AS n FROM habit_schedules'),
    registros: await contar('SELECT COUNT(*) AS n FROM habit_logs WHERE eliminado_en IS NULL'),
    pendientes: await contar('SELECT COUNT(*) AS n FROM outbox'),
  };
}
