import { periodo } from '../periodos';
import {
  detalleGrafica,
  encabezadosSemana,
  etiquetaRango,
  etiquetaPeriodo,
  etiquetasDivisiones,
  fichaDia,
  fraseDia,
  fraseResumen,
} from '../texto-periodo';

// Hoy es miércoles 2026-11-18.
const HOY = '2026-11-18';

describe('nombres de los periodos', () => {
  it('semana, mes y año', () => {
    expect(etiquetaPeriodo(periodo('semana', HOY))).toBe('16–22 nov');
    expect(etiquetaPeriodo(periodo('semana', '2026-12-30'))).toBe('28 dic – 3 ene');
    expect(etiquetaPeriodo(periodo('mes', HOY))).toBe('Noviembre 2026');
    expect(etiquetaPeriodo(periodo('anio', HOY))).toBe('2026');
  });

  it('las etiquetas de la semana marcan hoy y los días futuros', () => {
    const etiquetas = etiquetasDivisiones(periodo('semana', HOY), HOY);
    expect(etiquetas.map((e) => e.corta)).toEqual(['L', 'M', 'Hoy', 'J', 'V', 'S', 'D']);
    expect(etiquetas[2]).toMatchObject({ actual: true, futura: false, nombre: 'Miércoles 18' });
    expect(etiquetas[3].futura).toBe(true);
  });

  it('las del mes son rangos de días; las del año, meses', () => {
    expect(etiquetasDivisiones(periodo('mes', HOY), HOY).map((e) => e.corta)).toEqual([
      '1',
      '2–8',
      '9–15',
      '16–22',
      '23–29',
      '30',
    ]);
    const anio = etiquetasDivisiones(periodo('anio', HOY), HOY);
    expect(anio[10]).toMatchObject({ corta: 'N', nombre: 'Noviembre', actual: true });
    expect(anio[11].futura).toBe(true);
  });
});

describe('resumen en texto', () => {
  it('cuenta lo hecho, sin porcentajes, y cambia el tiempo en periodos pasados', () => {
    expect(fraseResumen(periodo('semana', HOY), { hechos: 12, total: 15 })).toBe(
      'Cumpliste 12 de 15 esta semana',
    );
    expect(fraseResumen(periodo('mes', HOY, -1), { hechos: 3, total: 4 })).toBe(
      'Cumpliste 3 de 4 ese mes',
    );
  });

  it('sin nada que contar, un texto amable', () => {
    expect(fraseResumen(periodo('semana', HOY), { hechos: 0, total: 0 })).toBe(
      'Todavía no hay nada que contar esta semana.',
    );
    expect(fraseResumen(periodo('anio', HOY, -1), { hechos: 0, total: 0 })).toBe(
      'No tenías hábitos ese año.',
    );
  });

  it('el detalle para TalkBack nombra cada división', () => {
    const p = periodo('semana', HOY);
    const texto = detalleGrafica(etiquetasDivisiones(p, HOY), [
      { hechos: 2, total: 2 },
      { hechos: 0, total: 0 },
      { hechos: 1, total: 1 },
    ]);
    expect(
      texto.startsWith('Lunes 16: 2 de 2. Martes 17: sin hábitos. Miércoles 18: 1 de 1.'),
    ).toBe(true);
    expect(texto).toContain('Jueves 19: todavía no llega');
  });
});

describe('textos de Diario', () => {
  it('fichas: «Hoy» y el día corto', () => {
    expect(fichaDia(HOY, HOY)).toEqual({
      corta: 'Hoy',
      numero: 18,
      nombre: 'Hoy, miércoles 18',
      esHoy: true,
    });
    expect(fichaDia('2026-11-16', HOY)).toMatchObject({ corta: 'Lun', nombre: 'Lunes 16' });
  });

  it('frases de hoy, de un día pasado y de uno futuro', () => {
    expect(fraseDia(HOY, HOY, { hechos: 1, total: 3 })).toBe('Llevas 1 de 3 hoy');
    expect(fraseDia('2026-11-16', HOY, { hechos: 2, total: 3 })).toBe('Hiciste 2 de 3 el lunes 16');
    expect(fraseDia('2026-11-19', HOY, { hechos: 0, total: 3 })).toBe(
      'El jueves 19 te tocan 3 hábitos',
    );
    expect(fraseDia('2026-11-19', HOY, { hechos: 0, total: 1 })).toBe(
      'El jueves 19 te toca 1 hábito',
    );
    expect(fraseDia('2026-11-15', HOY, { hechos: 0, total: 0 })).toBe(
      'Este día no tenías hábitos.',
    );
  });

  it('encabezados de la semana con letra y número', () => {
    const e = encabezadosSemana(periodo('semana', HOY), HOY);
    expect(e[0]).toEqual({ letra: 'L', numero: 16, nombre: 'Lunes 16', esHoy: false });
    expect(e[2].esHoy).toBe(true);
  });
});

describe('rango de la tira', () => {
  it('una semana en un mes o entre dos', () => {
    expect(etiquetaRango({ desde: '2026-11-16', hasta: '2026-11-22' })).toBe('16–22 nov');
    expect(etiquetaRango({ desde: '2026-12-28', hasta: '2027-01-03' })).toBe('28 dic – 3 ene');
  });

  it('una semana de un solo día dice el día, no «1–1»', () => {
    expect(etiquetaRango({ desde: '2026-11-01', hasta: '2026-11-01' })).toBe('1 nov');
    const p = periodo('mes', HOY);
    const texto = detalleGrafica(etiquetasDivisiones(p, HOY), [{ hechos: 1, total: 1 }]);
    expect(texto.startsWith('Semana del 1 nov: 1 de 1.')).toBe(true);
  });
});
