// Decide a qué zona de la app va el usuario según su sesión y su perfil (SDD 9.1).
// Es una función pura para poder probar cada caso; el layout raíz la usa en sus guardas.

export type AppZone = 'loading' | 'auth' | 'recovery' | 'profile-error' | 'onboarding' | 'tabs';

export type SessionRouteInput = {
  initializing: boolean;
  hasSession: boolean;
  isRecovery: boolean;
  profileStatus: 'idle' | 'loading' | 'error' | 'ready';
  mode: 'tradicional' | 'guiado' | null;
};

export function resolveAppZone(input: SessionRouteInput): AppZone {
  if (input.initializing) return 'loading';
  if (!input.hasSession) return 'auth';
  // Al abrir el enlace de recuperación hay sesión, pero primero se crea la nueva contraseña.
  if (input.isRecovery) return 'recovery';
  if (input.profileStatus === 'idle' || input.profileStatus === 'loading') return 'loading';
  if (input.profileStatus === 'error') return 'profile-error';
  // Sin modo elegido, el usuario todavía no termina la bienvenida.
  return input.mode === null ? 'onboarding' : 'tabs';
}
