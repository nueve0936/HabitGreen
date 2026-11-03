import { es } from '@/i18n/es';

import { authErrorMessage } from '../auth-error-message';

describe('authErrorMessage', () => {
  it('traduce los códigos conocidos', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', status: 400 })).toBe(
      es.auth.errores.credenciales,
    );
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toBe(
      es.auth.errores.correoNoConfirmado,
    );
  });

  it('reconoce el límite de intentos por estado 429', () => {
    expect(authErrorMessage({ status: 429 })).toBe(es.auth.errores.demasiadosIntentos);
  });

  it('reconoce los fallos de red', () => {
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(
      es.auth.errores.sinConexion,
    );
  });

  it('nunca muestra el texto técnico', () => {
    expect(authErrorMessage({ message: 'Database error saving new user', status: 500 })).toBe(
      es.comun.errorGenerico,
    );
    expect(authErrorMessage(null)).toBe(es.comun.errorGenerico);
  });
});
