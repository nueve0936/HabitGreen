import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';

import { leerDatosAvisos } from '@/db/reminders-repository';
import { es } from '@/i18n/es';
import { colors } from '@/theme';

import { siguientePaso, type SiguientePaso } from './domain/permiso';
import { planificarAvisos, type AvisoPlaneado } from './domain/planificar-avisos';

// Lo que toca `expo-notifications` (SDD 7.1): el canal de Android y el permiso. Los avisos son
// aproximados a propósito: sin el permiso de alarmas exactas, que en Android 14 o superior obligaría
// a pasar por Ajustes, pueden llegar unos minutos tarde.

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

// Ventana móvil (SDD 7.1): cada recálculo cancela lo programado y vuelve a programar los avisos de
// los próximos 7 días. Si lo planeado no cambió desde la última vez, no se toca nada.
let ultimaFirma: string | null = null;
let enCurso: Promise<void> | null = null;
let repetir = false;

function firma(avisos: readonly AvisoPlaneado[]): string {
  return avisos.map((a) => `${a.id}@${a.fecha.getTime()}|${a.titulo}|${a.cuerpo}`).join('\n');
}

async function programar(userId: string): Promise<void> {
  const datos = await leerDatosAvisos(userId);
  const avisos = datos ? planificarAvisos(datos, new Date()) : [];
  const nueva = firma(avisos);
  if (nueva === ultimaFirma) return;
  ultimaFirma = null;
  await cancelAllScheduledNotificationsAsync();
  for (const aviso of avisos) {
    await scheduleNotificationAsync({
      identifier: aviso.id,
      content: { title: aviso.titulo, body: aviso.cuerpo, data: { habitId: aviso.habitId } },
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
