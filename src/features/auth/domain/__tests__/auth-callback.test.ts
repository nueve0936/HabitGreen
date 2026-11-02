import { parseAuthCallbackUrl } from '../auth-callback';

describe('parseAuthCallbackUrl', () => {
  it('lee los tokens del fragmento al confirmar la cuenta', () => {
    const result = parseAuthCallbackUrl(
      'habitgreen://auth-callback#access_token=abc&refresh_token=def&expires_in=3600&type=signup',
    );
    expect(result).toEqual({
      kind: 'session',
      accessToken: 'abc',
      refreshToken: 'def',
      type: 'signup',
    });
  });

  it('marca el tipo recovery al recuperar la contraseña', () => {
    const result = parseAuthCallbackUrl(
      'exp://192.168.1.10:8081/--/auth-callback#access_token=a&refresh_token=b&type=recovery',
    );
    expect(result).toMatchObject({ kind: 'session', type: 'recovery' });
  });

  it('acepta el flujo con código en la consulta', () => {
    expect(parseAuthCallbackUrl('habitgreen://auth-callback?code=xyz')).toEqual({
      kind: 'code',
      code: 'xyz',
      type: null,
    });
  });

  it('devuelve el error de un enlace expirado', () => {
    const result = parseAuthCallbackUrl(
      'habitgreen://auth-callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid',
    );
    expect(result).toEqual({
      kind: 'error',
      errorCode: 'otp_expired',
      description: 'Email link is invalid',
    });
  });

  it('ignora enlaces sin datos de autenticación', () => {
    expect(parseAuthCallbackUrl('habitgreen://perfil')).toBeNull();
    expect(parseAuthCallbackUrl('habitgreen://auth-callback#access_token=solo-uno')).toBeNull();
  });

  it('ignora un tipo desconocido', () => {
    const result = parseAuthCallbackUrl(
      'habitgreen://auth-callback#access_token=a&refresh_token=b&type=otro',
    );
    expect(result).toMatchObject({ kind: 'session', type: null });
  });
});
