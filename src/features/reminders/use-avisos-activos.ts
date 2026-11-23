import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { alarmasExactas, permisoConcedido } from './avisos';

/** Revisa un permiso al montar y al volver de los ajustes. Si no se puede leer, cuenta como dado. */
function usePermiso(leer: () => Promise<boolean>): boolean {
  const [dado, setDado] = useState(true);
  useEffect(() => {
    const revisar = () => {
      leer()
        .then(setDado)
        .catch(() => setDado(true));
    };
    revisar();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') revisar();
    });
    return () => suscripcion.remove();
  }, [leer]);
  return dado;
}

/** ¿Están permitidos los avisos en Android? */
export function useAvisosActivos(): boolean {
  return usePermiso(permisoConcedido);
}

/** ¿Pueden llegar a la hora exacta? («Alarmas y recordatorios» de Android 12 o superior). */
export function useAlarmasExactas(): boolean {
  return usePermiso(alarmasExactas);
}
