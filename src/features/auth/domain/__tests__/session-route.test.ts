import { resolveAppZone, type SessionRouteInput } from '../session-route';

const base: SessionRouteInput = {
  initializing: false,
  hasSession: true,
  isRecovery: false,
  profileStatus: 'ready',
  mode: 'tradicional',
};

describe('resolveAppZone', () => {
  it('espera mientras se lee la sesión guardada', () => {
    expect(resolveAppZone({ ...base, initializing: true })).toBe('loading');
  });

  it('manda a la zona de cuenta sin sesión', () => {
    expect(resolveAppZone({ ...base, hasSession: false, profileStatus: 'idle' })).toBe('auth');
  });

  it('prioriza crear la nueva contraseña al recuperar', () => {
    expect(resolveAppZone({ ...base, isRecovery: true })).toBe('recovery');
  });

  it('espera al perfil antes de decidir', () => {
    expect(resolveAppZone({ ...base, profileStatus: 'loading' })).toBe('loading');
    expect(resolveAppZone({ ...base, profileStatus: 'idle' })).toBe('loading');
  });

  it('muestra el error si el perfil no carga', () => {
    expect(resolveAppZone({ ...base, profileStatus: 'error' })).toBe('profile-error');
  });

  it('lleva a la bienvenida si aún no hay modo', () => {
    expect(resolveAppZone({ ...base, mode: null })).toBe('onboarding');
  });

  it('lleva a las pestañas con cualquier modo elegido', () => {
    expect(resolveAppZone({ ...base, mode: 'tradicional' })).toBe('tabs');
    expect(resolveAppZone({ ...base, mode: 'guiado' })).toBe('tabs');
  });
});
