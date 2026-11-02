import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from './env';
import { createChunkedSecureStorage } from './secure-storage';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    // En web (solo para pruebas rápidas) se usa el almacenamiento del navegador.
    storage: Platform.OS === 'web' ? undefined : createChunkedSecureStorage(),
    autoRefreshToken: true,
    persistSession: true,
    // En el teléfono no hay barra de direcciones: los enlaces del correo se procesan a mano
    // en features/auth (useAuthDeepLinks).
    detectSessionInUrl: false,
  },
});

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
