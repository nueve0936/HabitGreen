import { createClient, type Session } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from './env';
import { createChunkedSecureStorage } from './secure-storage';

const storage = Platform.OS === 'web' ? undefined : createChunkedSecureStorage();
// La misma clave que Supabase usa por defecto; se fija aquí para poder leer la sesión guardada.
const storageKey = `sb-${new URL(env.supabaseUrl).hostname.split('.')[0]}-auth-token`;

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    // En web (solo para pruebas rápidas) se usa el almacenamiento del navegador.
    storage,
    storageKey,
    autoRefreshToken: true,
    persistSession: true,
    // En el teléfono no hay barra de direcciones: los enlaces del correo se procesan a mano
    // en features/auth (useAuthDeepLinks).
    detectSessionInUrl: false,
  },
});

/**
 * Sesión guardada en el teléfono, aunque su token ya venció. Sin red, Supabase no puede renovarla
 * y `getSession()` devuelve null; con esta copia la app abre igual con los datos locales, y la
 * renovación automática la reemplaza cuando vuelve la conexión.
 */
export async function leerSesionGuardada(): Promise<Session | null> {
  if (!storage) return null;
  try {
    const raw = await storage.getItem(storageKey);
    const sesion = raw ? (JSON.parse(raw) as Partial<Session>) : null;
    return sesion?.user?.id && sesion.refresh_token ? (sesion as Session) : null;
  } catch {
    return null;
  }
}

/**
 * Borra la sesión guardada sin pedir nada al servidor. Sin red, `signOut` de Supabase intenta antes
 * renovar el token, falla y no la borra; así se cierra igual cuando caduca sin conexión.
 */
export async function borrarSesionGuardada(): Promise<void> {
  if (!storage) return;
  try {
    await storage.removeItem(storageKey);
  } catch {
    // Ya no estaba.
  }
}

// Solo se renueva el token mientras la app está en primer plano (recomendación de Supabase).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
