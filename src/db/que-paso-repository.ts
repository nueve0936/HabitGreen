import {
  horarioVigente,
  type Habito,
  type Horario,
} from '@/features/habits/domain/habitos-del-dia';
import type { ContextoQuePaso } from '@/features/reschedule/domain/que-paso';
import { fechaLocal } from '@/lib/dates';

import { getDb, leerFilas } from './database';
import { puedeHacerseMasLigero } from './progression-repository';
import { leerAjustesEn } from './settings-repository';

// Lo que necesita «¿Qué pasó?» para elegir su sugerencia (ver `reschedule/domain/que-paso`). Solo
// lee: no guarda la respuesta.

export async function leerContextoQuePaso(
  userId: string,
  habitId: string,
): Promise<ContextoQuePaso> {
  const db = await getDb();
  const [habito] = await leerFilas<Habito>(db, 'habits', 'id = ?', [habitId]);
  const horarios = await leerFilas<Horario>(db, 'habit_schedules', 'habit_id = ?', [habitId]);
  const vigente = horarioVigente(horarios, fechaLocal());
  const ajustes = await leerAjustesEn(db, userId);
  return {
    masLigero: await puedeHacerseMasLigero(userId, habitId).catch(() => false),
    conDuracion: (habito?.duracion_min ?? 0) > 0,
    recordatorio: Boolean(vigente?.notificar && vigente.hora),
    segundoAviso: ajustes?.segundoAviso ?? false,
    segundoAvisoDisponible: ajustes !== null && ajustes.estilo !== 'resumen_nocturno',
  };
}
