// Interpreta el enlace con el que Supabase regresa a la app desde un correo (confirmación de
// cuenta o recuperación de contraseña). Supabase pone los datos en el fragmento (#...) o en la
// consulta (?...), según el flujo:
//   habitgreen://auth-callback#access_token=...&refresh_token=...&type=recovery
//   habitgreen://auth-callback?code=...
//   habitgreen://auth-callback#error=access_denied&error_code=otp_expired&error_description=...

export type AuthCallbackType = 'signup' | 'recovery' | 'magiclink' | 'invite' | 'email_change';

export type AuthCallback =
  | { kind: 'session'; accessToken: string; refreshToken: string; type: AuthCallbackType | null }
  | { kind: 'code'; code: string; type: AuthCallbackType | null }
  | { kind: 'error'; errorCode: string | null; description: string | null };

const KNOWN_TYPES: readonly AuthCallbackType[] = [
  'signup',
  'recovery',
  'magiclink',
  'invite',
  'email_change',
];

function readParams(url: string): URLSearchParams {
  const params = new URLSearchParams();
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  if (queryIndex !== -1) {
    const end = hashIndex !== -1 && hashIndex > queryIndex ? hashIndex : url.length;
    new URLSearchParams(url.slice(queryIndex + 1, end)).forEach((value, key) =>
      params.set(key, value),
    );
  }
  // Lo del fragmento gana sobre la consulta: ahí van los tokens.
  if (hashIndex !== -1) {
    new URLSearchParams(url.slice(hashIndex + 1)).forEach((value, key) => params.set(key, value));
  }
  return params;
}

function readType(params: URLSearchParams): AuthCallbackType | null {
  const type = params.get('type');
  return type !== null && (KNOWN_TYPES as readonly string[]).includes(type)
    ? (type as AuthCallbackType)
    : null;
}

/** Devuelve null si el enlace no trae nada de autenticación. */
export function parseAuthCallbackUrl(url: string): AuthCallback | null {
  const params = readParams(url);

  const error = params.get('error') ?? params.get('error_code');
  if (error !== null) {
    return {
      kind: 'error',
      errorCode: params.get('error_code') ?? error,
      description: params.get('error_description'),
    };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    return { kind: 'session', accessToken, refreshToken, type: readType(params) };
  }

  const code = params.get('code');
  if (code) {
    return { kind: 'code', code, type: readType(params) };
  }

  return null;
}
