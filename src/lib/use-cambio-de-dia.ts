import { useEffect } from 'react';
import { AppState } from 'react-native';

import { msHastaMedianoche, useFechaHoy } from './fecha-hoy';

// Vigila el cambio de día con la app abierta: un temporizador a la medianoche y una revisión al
// volver al frente (con el teléfono dormido, el temporizador puede llegar tarde). Se monta una
// vez, en las pestañas.

// Un segundo de margen para que el reloj ya marque el día nuevo.
const MARGEN_MS = 1000;

export function useCambioDeDia(): void {
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const programar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(
        () => {
          useFechaHoy.getState().revisar();
          programar();
        },
        msHastaMedianoche(new Date()) + MARGEN_MS,
      );
    };

    // Al montar también se revisa: la app pudo quedarse en otra pantalla al cambiar el día.
    useFechaHoy.getState().revisar();
    programar();

    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      useFechaHoy.getState().revisar();
      programar();
    });

    return () => {
      clearTimeout(temporizador);
      suscripcion.remove();
    };
  }, []);
}
