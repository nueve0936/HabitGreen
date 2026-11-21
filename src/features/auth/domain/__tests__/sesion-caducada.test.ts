import { caducoSinConexion, msRestantesAviso } from '../sesion-caducada';

const DIA = 86_400_000;
const AHORA = Date.UTC(2026, 10, 19);

describe('sesión sin conexión', () => {
  it('sigue abierta hasta 60 días sin conexión', () => {
    expect(caducoSinConexion(AHORA - 3 * DIA, AHORA)).toBe(false);
    expect(caducoSinConexion(AHORA - 60 * DIA, AHORA)).toBe(false);
  });

  it('caduca pasados los 60 días', () => {
    expect(caducoSinConexion(AHORA - 60 * DIA - 1, AHORA)).toBe(true);
    expect(caducoSinConexion(AHORA - 90 * DIA, AHORA)).toBe(true);
  });

  it('sin registro de conexión no caduca', () => {
    expect(caducoSinConexion(null, AHORA)).toBe(false);
  });
});

describe('aviso de sesión caducada', () => {
  it('le queda lo que falta para vencer', () => {
    expect(msRestantesAviso(AHORA + 7_000, AHORA)).toBe(7_000);
  });

  it('vencido o sin mostrar, ya no se ve', () => {
    expect(msRestantesAviso(AHORA - 1, AHORA)).toBe(0);
    expect(msRestantesAviso(null, AHORA)).toBe(0);
  });
});
