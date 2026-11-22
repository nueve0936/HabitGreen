import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { permisoConcedido } from './avisos';

/** ¿Están permitidos los avisos en Android? Se vuelve a revisar al regresar de los ajustes. */
export function useAvisosActivos(): boolean {
  const [activos, setActivos] = useState(true);
  useEffect(() => {
    const revisar = () => {
      permisoConcedido()
        .then(setActivos)
        .catch(() => setActivos(true));
    };
    revisar();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') revisar();
    });
    return () => suscripcion.remove();
  }, []);
  return activos;
}
