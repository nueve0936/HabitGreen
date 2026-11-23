import Storage from 'expo-sqlite/kv-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { es } from '@/i18n/es';

import { alarmasExactas, leerPermiso, pedirAlarmasExactas, pedirPermiso } from './avisos';
import type { SiguientePaso } from './domain/permiso';

// Pide el permiso de avisos en contexto (SDD 7.1): explica para qué sirve y abre la pregunta de
// Android o, si ya no deja preguntar, manda a Ajustes. `dialogo` se coloca en la pantalla.
//
// - `exigir`: elegir la hora de un recordatorio. La acción solo sigue si el permiso queda dado,
//   porque un recordatorio sin permiso nunca sonaría.
// - `sugerir`: confirmar el plan. La acción sigue responda lo que responda y recibe si el permiso
//   quedó dado (sin él, el plan se guarda sin horas).

//
// Con el permiso de avisos ya dado, se ofrece una sola vez el de alarmas exactas (decisión del
// usuario del 22 nov): sin él, Android puede retrasar los avisos hasta 1 hora. Responda lo que
// responda, la acción ya siguió; si dice «Ahora no», queda la opción en «Avisos y horas».

export type ModoPermiso = 'exigir' | 'sugerir';

const CLAVE_EXACTAS = 'habitgreen-exactas-preguntado';

function exactasPreguntadas(): boolean {
  try {
    return Storage.getItemSync(CLAVE_EXACTAS) === '1';
  } catch {
    return false;
  }
}

function marcarExactasPreguntadas(): void {
  try {
    Storage.setItemSync(CLAVE_EXACTAS, '1');
  } catch {
    // Sin poder guardarlo, a lo más se vuelve a ofrecer otro día.
  }
}

type Accion = (concedido: boolean) => void;
type Pendiente = { accion: Accion; modo: ModoPermiso; siguiente: SiguientePaso };

export function usePermisoAvisos() {
  const t = es.avisos;
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  /** null mientras se lee. */
  const [concedido, setConcedido] = useState<boolean | null>(null);
  const [ofreciendoExactas, setOfreciendoExactas] = useState(false);
  // Mientras se lee el permiso el botón sigue activo: un doble toque haría la acción dos veces.
  const revisando = useRef(false);

  const revisar = useCallback(async (): Promise<SiguientePaso> => {
    const { siguiente } = await leerPermiso();
    setConcedido(siguiente === 'listo');
    return siguiente;
  }, []);

  // Al volver de Ajustes de Android, el permiso puede haber cambiado.
  useEffect(() => {
    const leer = () => {
      leerPermiso()
        .then(({ siguiente }) => setConcedido(siguiente === 'listo'))
        .catch(() => setConcedido(null));
    };
    leer();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') leer();
    });
    return () => suscripcion.remove();
  }, []);

  const ofrecerExactas = async () => {
    if (exactasPreguntadas()) return;
    const exactas = await alarmasExactas().catch(() => true);
    if (!exactas) setOfreciendoExactas(true);
  };

  const responderExactas = (permitir: boolean) => {
    setOfreciendoExactas(false);
    marcarExactasPreguntadas();
    // Al volver de la pantalla de Android, los avisos se reprograman solos (useAvisos).
    if (permitir) pedirAlarmasExactas().catch(() => {});
  };

  const conPermiso = async (accion: Accion, modo: ModoPermiso = 'sugerir') => {
    if (revisando.current) return;
    revisando.current = true;
    try {
      let siguiente: SiguientePaso = 'listo';
      try {
        siguiente = await revisar();
      } catch (causa) {
        // Sin poder leer el permiso se sigue: es mejor guardar que trabar a la persona.
        console.warn('No se pudo leer el permiso de avisos', causa);
      }
      // Si no se pudo leer, cuenta como dado: un error no debe quitar recordatorios.
      if (siguiente === 'listo') {
        accion(true);
        void ofrecerExactas();
      } else setPendiente({ accion, modo, siguiente });
    } finally {
      revisando.current = false;
    }
  };

  const responder = async (activar: boolean) => {
    if (!pendiente) return;
    const { accion, modo, siguiente } = pendiente;
    setPendiente(null);
    let dado = false;
    if (activar && siguiente === 'preguntar') {
      try {
        dado = await pedirPermiso();
        setConcedido(dado);
      } catch (causa) {
        console.warn('No se pudo pedir el permiso de avisos', causa);
      }
    } else if (activar) {
      // Al volver de Ajustes se revisa otra vez (AppState).
      void Linking.openSettings();
    }
    if (dado) {
      accion(true);
      void ofrecerExactas();
    } else if (modo === 'sugerir') accion(false);
  };

  const enAjustes = pendiente?.siguiente === 'ajustes';
  const dialogo = (
    <>
      <ConfirmDialog
        visible={pendiente !== null}
        tipo="confirmar"
        mensaje={enAjustes ? t.explicacionAjustes : t.explicacion}
        cancelar={t.ahoraNo}
        confirmar={enAjustes ? t.abrirAjustes : t.activar}
        onCancelar={() => void responder(false)}
        onConfirmar={() => void responder(true)}
      />
      <ConfirmDialog
        visible={ofreciendoExactas}
        tipo="confirmar"
        mensaje={t.exactasExplicacion}
        cancelar={t.ahoraNo}
        confirmar={t.exactasPermitir}
        onCancelar={() => responderExactas(false)}
        onConfirmar={() => responderExactas(true)}
      />
    </>
  );

  return { conPermiso, dialogo, concedido };
}
