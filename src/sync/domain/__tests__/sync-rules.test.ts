import {
  clavesPendientes,
  esRechazoDefinitivo,
  filasAplicables,
  idsCompactables,
  siguienteCursor,
  type EntradaOutbox,
} from '../sync-rules';

const CLAVE = 'h1|2026-11-01';

function complete(id: number, clave = CLAVE): EntradaOutbox {
  const [habit_id, fecha] = clave.split('|');
  return {
    id,
    intentos: 0,
    operacion: 'complete',
    tabla: 'habit_logs',
    clave,
    payload: { log_id: `l${id}`, habit_id, fecha },
  };
}

function uncomplete(id: number, clave = CLAVE): EntradaOutbox {
  const [habit_id, fecha] = clave.split('|');
  return {
    id,
    intentos: 0,
    operacion: 'uncomplete',
    tabla: 'habit_logs',
    clave,
    payload: { habit_id, fecha },
  };
}

function upsert(id: number, clave: string): EntradaOutbox {
  return { id, intentos: 0, operacion: 'upsert', tabla: 'habits', clave, payload: { id: clave } };
}

describe('compactar la cola (SDD 3.4)', () => {
  it('quita un complete seguido de su uncomplete', () => {
    expect(idsCompactables([upsert(1, 'h1'), complete(2), uncomplete(3)])).toEqual([2, 3]);
  });

  it('no quita un uncomplete seguido de un complete (el check-in ya estaba en el servidor)', () => {
    expect(idsCompactables([uncomplete(1), complete(2)])).toEqual([]);
  });

  it('marcar, deshacer y volver a marcar deja solo el último complete', () => {
    expect(idsCompactables([complete(1), uncomplete(2), complete(3)])).toEqual([1, 2]);
  });

  it('no quita un complete que ya se intentó enviar (pudo llegar al servidor sin respuesta)', () => {
    expect(idsCompactables([{ ...complete(1), intentos: 1 }, uncomplete(2)])).toEqual([]);
    expect(idsCompactables([{ ...complete(1), intentos: 2 }, uncomplete(2), complete(3)])).toEqual(
      [],
    );
  });

  it('no mezcla hábitos ni fechas distintas', () => {
    expect(
      idsCompactables([
        complete(1),
        uncomplete(2, 'h1|2026-10-31'),
        uncomplete(3, 'h2|2026-11-01'),
      ]),
    ).toEqual([]);
  });
});

describe('rechazos del servidor', () => {
  it.each([
    [{ code: '22008' }, true],
    [{ code: 'PGRST116' }, true],
    [{ code: '' }, false],
    [{ code: null }, false],
    [{}, false],
    [null, false],
  ])('%j → %s', (error, esperado) => {
    expect(esRechazoDefinitivo(error)).toBe(esperado);
  });
});

describe('mezcla de filas descargadas', () => {
  it('no pisa filas con cambios locales pendientes', () => {
    const pendientes = clavesPendientes([upsert(1, 'h1'), complete(2)]);
    const habitos = [{ id: 'h1' }, { id: 'h2' }];
    expect(filasAplicables('habits', habitos, (f) => f.id, pendientes)).toEqual([{ id: 'h2' }]);
    const logs = [
      { habit_id: 'h1', fecha: '2026-11-01' },
      { habit_id: 'h1', fecha: '2026-10-31' },
    ];
    expect(
      filasAplicables('habit_logs', logs, (f) => `${f.habit_id}|${f.fecha}`, pendientes),
    ).toEqual([{ habit_id: 'h1', fecha: '2026-10-31' }]);
  });

  it('un update pendiente también protege su fila', () => {
    const update: EntradaOutbox = {
      id: 1,
      intentos: 0,
      operacion: 'update',
      tabla: 'user_settings',
      clave: 'u1',
      payload: { presupuesto_min: 30 },
    };
    const pendientes = clavesPendientes([update]);
    expect(
      filasAplicables('user_settings', [{ user_id: 'u1' }], (f) => f.user_id, pendientes),
    ).toEqual([]);
  });

  it('los update no se compactan con los check-ins', () => {
    const update: EntradaOutbox = {
      id: 3,
      intentos: 0,
      operacion: 'update',
      tabla: 'habits',
      clave: 'h1',
      payload: { activo: false },
    };
    expect(idsCompactables([complete(1), update, uncomplete(2)])).toEqual([1, 2]);
  });
});

describe('cursor de descarga', () => {
  it('toma el updated_at más reciente del servidor', () => {
    const filas = [
      { updated_at: '2026-11-01T10:00:00.5+00:00' },
      { updated_at: '2026-11-01T12:00:00.123456+00:00' },
      { updated_at: '2026-11-01T11:00:00+00:00' },
    ];
    expect(siguienteCursor('2026-10-01T00:00:00+00:00', filas)).toBe(
      '2026-11-01T12:00:00.123456+00:00',
    );
  });

  it('compara microsegundos aunque la fracción tenga distinto largo', () => {
    const filas = [
      { updated_at: '2026-11-01T10:00:00.123456+00:00' },
      { updated_at: '2026-11-01T10:00:00.5+00:00' },
    ];
    expect(siguienteCursor(null, filas)).toBe('2026-11-01T10:00:00.5+00:00');
    expect(
      siguienteCursor('2026-11-01T10:00:00.123457+00:00', [
        { updated_at: '2026-11-01T10:00:00.123456+00:00' },
      ]),
    ).toBe('2026-11-01T10:00:00.123457+00:00');
  });

  it('conserva el anterior si no llegó nada', () => {
    expect(siguienteCursor('2026-10-01T00:00:00+00:00', [])).toBe('2026-10-01T00:00:00+00:00');
    expect(siguienteCursor(null, [])).toBeNull();
  });
});
