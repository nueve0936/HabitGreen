import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useDbVersion } from '@/db/db-version-store';

import { reprogramarAvisos } from './avisos';

// Cuándo se recalculan los avisos (SDD 7.1): al abrir la app, al volver a primer plano y con cada
// cambio local o sincronización. Toda escritura avisa con `useDbVersion`, así que esto cubre crear,
// editar, pausar o eliminar hábitos, completar o deshacer, cambiar ajustes y reprogramar.
// Se monta en el layout de las pestañas, junto a la sincronización.

const ESPERA_MS = 1000;

function recalcular(userId: string): void {
  reprogramarAvisos(userId).catch((causa: unknown) => {
    console.warn('No se pudieron programar los avisos', causa);
  });
}

export function useAvisos(userId: string | null): void {
  const version = useDbVersion((s) => s.version);

  // Varias escrituras seguidas (por ejemplo, una sincronización) generan un solo recálculo.
  useEffect(() => {
    if (userId === null) return;
    const espera = setTimeout(() => recalcular(userId), ESPERA_MS);
    return () => clearTimeout(espera);
  }, [userId, version]);

  // Al volver a primer plano: los avisos que ya pasaron dejan lugar a los de los días siguientes.
  useEffect(() => {
    if (userId === null) return;
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') recalcular(userId);
    });
    return () => suscripcion.remove();
  }, [userId]);
}
