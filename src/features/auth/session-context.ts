import type { Session } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

import type { AppMode, Profile } from '@/db/profile-repository';

export type ProfileStatus = 'idle' | 'loading' | 'error' | 'ready';
/** Estado del último enlace de correo: none (ninguno), processing, done o error. */
export type CallbackStatus = 'none' | 'processing' | 'done' | 'error';

export type SessionContextValue = {
  initializing: boolean;
  session: Session | null;
  profile: Profile | null;
  profileStatus: ProfileStatus;
  /** Verdadero desde que se valida el código (o enlace) de recuperación hasta guardar la nueva contraseña. */
  isRecovery: boolean;
  callbackStatus: CallbackStatus;
  reloadProfile: () => void;
  chooseMode: (mode: AppMode) => Promise<void>;
  finishRecovery: () => void;
  /**
   * Cierra sesión y borra los datos del teléfono. Con `revisarPendientes`, si después de intentar
   * sincronizar quedan cambios sin subir, no cierra y devuelve 'pendientes' para preguntar antes.
   */
  signOut: (opciones?: { revisarPendientes?: boolean }) => Promise<'cerrada' | 'pendientes'>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>');
  }
  return value;
}
