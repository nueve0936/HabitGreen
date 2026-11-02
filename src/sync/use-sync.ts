import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { configurarSync, pedirSincronizacion, sincronizarAhora } from './sync-engine';

/**
 * Cuándo sincroniza (SDD 3.4): al abrir la app, al volver a primer plano y al recuperar la red.
 * Después de cada escritura lo piden los repositorios. Se monta en el layout de las pestañas.
 */
export function useSync(userId: string | null): void {
  useEffect(() => {
    configurarSync(userId);
    if (userId === null) return;

    void sincronizarAhora();
    const app = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') pedirSincronizacion();
    });
    const red = Network.addNetworkStateListener((estado) => {
      if (estado.isConnected) pedirSincronizacion();
    });

    return () => {
      app.remove();
      red.remove();
      configurarSync(null);
    };
  }, [userId]);
}
