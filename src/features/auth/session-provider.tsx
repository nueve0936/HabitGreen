import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getProfile, saveMode, type AppMode, type Profile } from '@/db/profile-repository';
import { asegurarDuenoBaseLocal, vaciarBaseLocal } from '@/db/database';
import { cancelarAvisos } from '@/features/reminders/avisos';
import { borrarSesionGuardada, leerSesionGuardada, supabase } from '@/lib/supabase';
import { deviceTimeZone } from '@/lib/time-zone';
import { sincronizarAhora } from '@/sync/sync-engine';

import { parseAuthCallbackUrl } from './domain/auth-callback';
import { caducoSinConexion } from './domain/sesion-caducada';
import { leerUltimaConexion, marcarConexion, marcarSesionCaducada } from './sesion-caducada-store';
import {
  SessionContext,
  type CallbackStatus,
  type ProfileStatus,
  type SessionContextValue,
} from './session-context';

// Perfil cargado para un usuario concreto. Si cambia el usuario, el estado anterior deja de
// valer sin tener que limpiarlo a mano.
type ProfileState = { userId: string; status: ProfileStatus; profile: Profile | null };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [profileRequest, setProfileRequest] = useState(0);
  const [isRecovery, setIsRecovery] = useState(false);
  const [callbackStatus, setCallbackStatus] = useState<CallbackStatus>('none');
  // Cierre pedido por el usuario: no se explica como sesión caducada.
  const cerrandoAMano = useRef(false);

  // 1. Sesión guardada y cambios de sesión.
  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        // Sin red y con el token vencido, Supabase no puede renovarlo y no devuelve sesión, pero
        // la guardada sigue siendo válida: se usa para abrir la app con los datos locales.
        let sesion =
          data.session ?? (isAuthRetryableFetchError(error) ? await leerSesionGuardada() : null);
        if (sesion !== null) {
          // Más de 60 días sin conexión: la sesión caduca, pero los datos locales se quedan
          // (decisión del usuario). Sin registro previo, el conteo empieza ahora.
          const ultima = leerUltimaConexion();
          if (ultima === null) marcarConexion();
          else if (caducoSinConexion(ultima, Date.now())) {
            marcarSesionCaducada(true);
            await borrarSesionGuardada();
            sesion = null;
          }
        }
        if (active) setSession(sesion);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    // No se llaman funciones de Supabase dentro de este callback: solo se actualiza el estado.
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      if (event === 'SIGNED_OUT') setIsRecovery(false);
      // Renovar el token o entrar es hablar con el servidor: reinicia el conteo de 60 días.
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') marcarConexion();
      if (event === 'SIGNED_IN') marcarSesionCaducada(false);
      // Se cerró sin que el usuario lo pidiera (por ejemplo, desde otro lado): se explica al entrar.
      if (event === 'SIGNED_OUT' && !cerrandoAMano.current) marcarSesionCaducada(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // 2. Enlaces de los correos (confirmación y recuperación), al abrir la app o con la app abierta.
  useEffect(() => {
    const handled = new Set<string>();

    const handleUrl = (url: string | null) => {
      if (!url || handled.has(url)) return;
      const callback = parseAuthCallbackUrl(url);
      if (callback === null) return;
      handled.add(url);

      if (callback.kind === 'error') {
        setCallbackStatus('error');
        return;
      }

      setCallbackStatus('processing');
      const request =
        callback.kind === 'session'
          ? supabase.auth.setSession({
              access_token: callback.accessToken,
              refresh_token: callback.refreshToken,
            })
          : supabase.auth.exchangeCodeForSession(callback.code);

      request
        .then(({ error }) => {
          if (error) {
            setCallbackStatus('error');
            return;
          }
          if (callback.type === 'recovery') setIsRecovery(true);
          setCallbackStatus('done');
        })
        .catch(() => setCallbackStatus('error'));
    };

    Linking.getInitialURL()
      .then(handleUrl)
      .catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  // 3. Perfil del usuario con sesión. Antes se revisa que la base local sea de esta cuenta: si era
  // de otra, se vacía (y se cancelan sus avisos) mientras sigue la pantalla de carga, para que
  // nunca se vean sus hábitos.
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (userId === null) return;
    let active = true;
    asegurarDuenoBaseLocal(userId)
      .then((vaciada) => (vaciada ? cancelarAvisos() : undefined))
      .catch(() => {
        // Si la revisión falla, la sincronización la repite antes de subir o bajar nada.
      })
      .then(() => getProfile(userId))
      .then((profile) => {
        if (active) setProfileState({ userId, status: 'ready', profile });
      })
      .catch(() => {
        if (active) setProfileState({ userId, status: 'error', profile: null });
      });
    return () => {
      active = false;
    };
  }, [userId, profileRequest]);

  const current = profileState !== null && profileState.userId === userId ? profileState : null;
  const profileStatus: ProfileStatus = userId === null ? 'idle' : (current?.status ?? 'loading');
  const profile = current?.profile ?? null;

  const reloadProfile = useCallback(() => {
    setProfileState(null);
    setProfileRequest((n) => n + 1);
  }, []);

  const chooseMode = useCallback(
    async (mode: AppMode) => {
      if (userId === null) return;
      const updated = await saveMode(userId, mode, deviceTimeZone());
      setProfileState({ userId, status: 'ready', profile: updated });
    },
    [userId],
  );

  const finishRecovery = useCallback(() => setIsRecovery(false), []);

  const signOut = useCallback(async () => {
    // Antes de salir se intenta subir lo pendiente; después se borran los datos locales para que
    // la siguiente cuenta empiece limpia.
    // El borrado va en finally: ocurre aunque falle el cierre en Supabase.
    cerrandoAMano.current = true;
    try {
      await sincronizarAhora().catch(() => {});
      await supabase.auth.signOut();
    } finally {
      cerrandoAMano.current = false;
      await vaciarBaseLocal().catch(() => {});
      await cancelarAvisos().catch(() => {});
    }
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      initializing,
      session,
      profile,
      profileStatus,
      isRecovery,
      callbackStatus,
      reloadProfile,
      chooseMode,
      finishRecovery,
      signOut,
    }),
    [
      initializing,
      session,
      profile,
      profileStatus,
      isRecovery,
      callbackStatus,
      reloadProfile,
      chooseMode,
      finishRecovery,
      signOut,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
