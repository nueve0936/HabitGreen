import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getExactAlarmPermissionsAsync,
  getPermissionsAsync,
  requestExactAlarmPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationCategoryAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';

import { leerDatosAvisos } from '@/db/reminders-repository';
import { es } from '@/i18n/es';
import { fechaLocal } from '@/lib/dates';
import { colors } from '@/theme';

import { ACCION_HECHO, CATEGORIA_HABITO } from './domain/hecho-desde-aviso';
import { siguientePaso, type SiguientePaso } from './domain/permiso';
import {
  GRACIA_AVISOS_MS,
  planificarAvisos,
  repartirAvisos,
  type AvisoPlaneado,
} from './domain/planificar-avisos';

// Lo que toca `expo-notifications` (SDD 7.1): el canal de Android y los permisos. Con el permiso de
// alarmas exactas («Alarmas y recordatorios», decisión del usuario del 22 nov) los avisos llegan a
// su hora; sin él, Android los programa aproximados y puede retrasarlos hasta 1 hora.

export const CANAL_RECORDATORIOS = 'recordatorios';

/** Se llama al abrir la app: sin un canal creado, Android 13 no muestra la pregunta del permiso. */
export async function prepararAvisos(): Promise<void> {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      // Con `false`, Android no muestra el aviso desplegable.
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  await setNotificationChannelAsync(CANAL_RECORDATORIOS, {
    name: es.avisos.canal,
    // Android no deja cambiarla una vez creado el canal.
    importance: AndroidImportance.DEFAULT,
    lightColor: colors.accent,
  });
  // Botón «Hecho» de los avisos de un hábito (RI-04): abre la app y lo marca en Hoy.
  await setNotificationCategoryAsync(CATEGORIA_HABITO, [
    {
      identifier: ACCION_HECHO,
      buttonTitle: es.avisos.hecho,
      options: { opensAppToForeground: true },
    },
  ]);
}

/** Si el permiso está dado y, si no, qué se puede hacer (preguntar o mandar a Ajustes). */
export async function leerPermiso(): Promise<{ siguiente: SiguientePaso }> {
  const permiso = await getPermissionsAsync();
  return {
    siguiente: siguientePaso({ concedido: permiso.granted, puedePreguntar: permiso.canAskAgain }),
  };
}

export async function pedirPermiso(): Promise<boolean> {
  const permiso = await requestPermissionsAsync();
  return permiso.granted;
}

export async function permisoConcedido(): Promise<boolean> {
  return (await getPermissionsAsync()).granted;
}

/** Si los avisos pueden llegar a la hora exacta (en Android 11 o menos, siempre). */
export async function alarmasExactas(): Promise<boolean> {
  return (await getExactAlarmPermissionsAsync()).granted;
}

/**
 * Abre «Alarmas y recordatorios» de Android y resuelve al volver. Al volver, `useAvisos`
 * reprograma: el permiso es parte de la firma, así que todo se vuelve a programar exacto.
 */
export async function pedirAlarmasExactas(): Promise<boolean> {
  return (await requestExactAlarmPermissionsAsync()).granted;
}

// Ventana móvil (SDD 7.1): cada recálculo programa los avisos de los próximos 7 días y cancela los
// que ya no tocan. Los que ya pasaron pero siguen pendientes (Android retrasa los aproximados) no se
// cancelan: antes se cancelaba todo y esos avisos se perdían. Si nada cambió, no se toca nada.
let ultimaFirma: string | null = null;
let enCurso: Promise<void> | null = null;
let repetir = false;

// El tipo de alarma (exacta o aproximada) se decide al programar: si cambia el permiso, se reprograma.
function firma(avisos: readonly AvisoPlaneado[], conservar: readonly string[], exactas: boolean) {
  const lineas = avisos.map((a) => `${a.id}@${a.fecha.getTime()}|${a.titulo}|${a.cuerpo}`);
  return [exactas ? 'exactas' : 'aproximadas', conservar.join(','), ...lineas].join('\n');
}

async function programar(userId: string): Promise<void> {
  const ahora = new Date();
  const datos = await leerDatosAvisos(userId);
  const desde = new Date(ahora.getTime() - GRACIA_AVISOS_MS);
  const avisos = datos ? planificarAvisos(datos, ahora, desde) : [];
  const exactas = await alarmasExactas().catch(() => false);
  const programados = await getAllScheduledNotificationsAsync();
  const reparto = repartirAvisos(avisos, ahora, new Set(programados.map((n) => n.identifier)));
  const nueva = firma(reparto.programar, reparto.conservar, exactas);
  if (nueva === ultimaFirma) return;
  ultimaFirma = null;
  for (const id of reparto.cancelar) await cancelScheduledNotificationAsync(id);
  // Programar con el mismo identificador reemplaza el aviso anterior.
  for (const aviso of reparto.programar) {
    await scheduleNotificationAsync({
      identifier: aviso.id,
      // Solo los avisos de un hábito llevan «Hecho»; el día sirve para no marcar uno de ayer.
      content:
        aviso.habitId === null
          ? { title: aviso.titulo, body: aviso.cuerpo, data: { habitId: null } }
          : {
              title: aviso.titulo,
              body: aviso.cuerpo,
              data: { habitId: aviso.habitId, dia: fechaLocal(aviso.fecha) },
              categoryIdentifier: CATEGORIA_HABITO,
            },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: aviso.fecha,
        channelId: CANAL_RECORDATORIOS,
      },
    });
  }
  ultimaFirma = nueva;
}

/** Recalcula los avisos. Si llega otra petición mientras corre, se repite al terminar. */
export function reprogramarAvisos(userId: string): Promise<void> {
  if (enCurso) {
    repetir = true;
    return enCurso;
  }
  enCurso = (async () => {
    do {
      repetir = false;
      await programar(userId);
    } while (repetir);
  })().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

/** Al cerrar sesión: no deben llegar avisos de la cuenta anterior. */
export async function cancelarAvisos(): Promise<void> {
  ultimaFirma = null;
  await cancelAllScheduledNotificationsAsync();
}
