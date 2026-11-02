import { create } from 'zustand';

// Contador que sube cada vez que cambian los datos locales (una escritura o una sincronización).
// Las pantallas que leen SQLite con useLocalQuery vuelven a consultar cuando cambia.

type DbVersionState = {
  version: number;
  avisarCambio: () => void;
};

export const useDbVersion = create<DbVersionState>()((set) => ({
  version: 0,
  avisarCambio: () => set((s) => ({ version: s.version + 1 })),
}));

export function avisarCambioLocal(): void {
  useDbVersion.getState().avisarCambio();
}
