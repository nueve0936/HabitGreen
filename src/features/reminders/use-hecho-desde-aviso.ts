import {
  clearLastNotificationResponseAsync,
  dismissNotificationAsync,
  useLastNotificationResponse,
} from 'expo-notifications';
import { useEffect } from 'react';
import { create } from 'zustand';

import { navegar } from '@/lib/navegar';

import { leerHechoDeAviso, type HechoPendiente } from './domain/hecho-desde-aviso';

// Botón «Hecho» del aviso (RI-04): se escucha en las pestañas, que solo se montan con la sesión
// lista. Abre Hoy y deja el hábito pendiente; Hoy lo marca con el check-in de siempre (monedas,
// animación y tope del día) en cuanto tiene su lista. Funciona también con la app cerrada: al
// abrirse, `useLastNotificationResponse` entrega la última respuesta.

type EstadoHecho = {
  pendiente: HechoPendiente | null;
  poner: (pendiente: HechoPendiente) => void;
  /** Devuelve el pendiente y lo borra, para no marcarlo dos veces. */
  tomar: () => HechoPendiente | null;
  /** El «Hecho» era de un aviso de otro día: Hoy lo explica con un aviso flotante. */
  otroDia: boolean;
  marcarOtroDia: (otroDia: boolean) => void;
};

export const useHechoPendiente = create<EstadoHecho>()((set, get) => ({
  pendiente: null,
  poner: (pendiente) => set({ pendiente }),
  tomar: () => {
    const { pendiente } = get();
    if (pendiente) set({ pendiente: null });
    return pendiente;
  },
  otroDia: false,
  marcarOtroDia: (otroDia) => set({ otroDia }),
}));

// La misma respuesta puede llegar otra vez (al volver a montar las pestañas): se atiende una sola.
let ultimaAtendida: string | null = null;

export function useHechoDesdeAviso(): void {
  const respuesta = useLastNotificationResponse();

  useEffect(() => {
    if (!respuesta) return;
    const { request, date } = respuesta.notification;
    const clave = `${request.identifier}@${date}`;
    if (clave === ultimaAtendida) return;
    ultimaAtendida = clave;

    const hecho = leerHechoDeAviso(respuesta.actionIdentifier, request.content.data);
    if (!hecho) return;
    useHechoPendiente.getState().poner(hecho);
    // Android deja el aviso en la bandeja al tocar un botón: se quita a mano.
    dismissNotificationAsync(request.identifier).catch(() => {});
    clearLastNotificationResponseAsync().catch(() => {});
    navegar.navigate('/hoy');
  }, [respuesta]);
}
