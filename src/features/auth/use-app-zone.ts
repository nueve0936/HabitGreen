import type { Href } from 'expo-router';

import { resolveAppZone, type AppZone } from './domain/session-route';
import { useSession } from './session-context';

export function useAppZone(): AppZone {
  const session = useSession();
  return resolveAppZone({
    initializing: session.initializing,
    hasSession: session.session !== null,
    isRecovery: session.isRecovery,
    profileStatus: session.profileStatus,
    mode: session.profile?.modo ?? null,
  });
}

/** Primera pantalla de cada zona. */
export const ZONE_HOME: Record<Exclude<AppZone, 'loading' | 'profile-error'>, Href> = {
  auth: '/bienvenida',
  recovery: '/nueva-contrasena',
  onboarding: '/empezar',
  tabs: '/hoy',
};
