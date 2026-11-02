import { create } from 'zustand';

// Estado visible de la sincronización (por ahora solo lo muestra el panel de Perfil).

type SyncState = {
  sincronizando: boolean;
  /** Hora de la última sincronización completa, en ISO. */
  ultima: string | null;
  /** Mensaje del último error, o null si la última vuelta salió bien o no había red. */
  error: string | null;
};

export const useSyncStore = create<SyncState>()(() => ({
  sincronizando: false,
  ultima: null,
  error: null,
}));
