import { es } from '@/i18n/es';

// Traduce los errores de Supabase Auth a mensajes amables. Nunca se muestra el texto técnico.
// Códigos: https://supabase.com/docs/guides/auth/debugging/error-codes

type AuthErrorLike = { code?: string; status?: number; message?: string; name?: string };

const MESSAGES_BY_CODE: Record<string, string> = {
  invalid_credentials: es.auth.errores.credenciales,
  email_not_confirmed: es.auth.errores.correoNoConfirmado,
  user_already_exists: es.auth.errores.usuarioExiste,
  email_exists: es.auth.errores.usuarioExiste,
  over_email_send_rate_limit: es.auth.errores.demasiadosIntentos,
  over_request_rate_limit: es.auth.errores.demasiadosIntentos,
  weak_password: es.auth.errores.contrasenaDebil,
  same_password: es.auth.errores.mismaContrasena,
  otp_expired: es.auth.callback.error,
};

export function authErrorMessage(error: unknown): string {
  if (error === null || typeof error !== 'object') return es.comun.errorGenerico;
  const { code, status, name } = error as AuthErrorLike;

  if (code && code in MESSAGES_BY_CODE) return MESSAGES_BY_CODE[code];
  if (status === 429) return es.auth.errores.demasiadosIntentos;
  // supabase-js marca así los fallos de red (sin respuesta del servidor).
  if (name === 'AuthRetryableFetchError' || status === 0) return es.comun.sinConexion;
  // Error no previsto: en desarrollo se muestra el detalle en la terminal de `expo start`.
  if (__DEV__ && process.env.NODE_ENV !== 'test') {
    console.warn('[auth] Error no reconocido de Supabase:', error);
  }
  return es.comun.errorGenerico;
}
