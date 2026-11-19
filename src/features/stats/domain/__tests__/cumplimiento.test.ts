import type {
  Habito,
  Horario,
  Ocurrencia,
  Registro,
} from '@/features/habits/domain/habitos-del-dia';
import type { Area } from '@/schemas/onboarding';

import {
  estadosDelRango,
  habitosDeUnDia,
  historial,
  rachasPorHabito,
  resumenDelPeriodo,
  type DatosEstadisticas,
} from '../cumplimiento';
import { periodo } from '../periodos';

// Hoy es miércoles 2026-11-18. Los hábitos empiezan el lunes 9.
const HOY = '2026-11-18';

function habito(id: string, cambios: Partial<Habito> = {}): Habito {
  return {
    id,
    category_id: 'c-mental',
    plan_id: null,
    titulo: `Hábito ${id}`,
    descripcion: null,
    duracion_min: 5,
    activo: true,
    archivado_en: null,
    ...cambios,
  };
}

function horario(habitId: string, dias: number[] = [1, 3, 5]): Horario {
  return {
    id: `s-${habitId}`,
    habit_id: habitId,
    dias_semana: dias,
    hora: '08:00',
    flexible: false,
    notificar: true,
    vigente_desde: '2026-11-09',
    vigente_hasta: null,
  };
}

const hecho = (habitId: string, fecha: string): Registro => ({
  habit_id: habitId,
  fecha,
  eliminado_en: null,
});

const categorias = new Map<string, Area>([
  ['c-mental', 'salud_mental'],
  ['c-fisica', 'salud_fisica'],
]);

function datos(cambios: Partial<DatosEstadisticas> = {}): DatosEstadisticas {
  return {
    habitos: [habito('a')],
    horarios: [horario('a')],
    ocurrencias: [],
    registros: [],
    categorias,
    ...cambios,
  };
}

const fechas = (d: DatosEstadisticas) => historial(d, HOY).map((o) => `${o.fecha} ${o.hecho}`);

describe('ocurrencias para estadísticas', () => {
  it('cuenta los días del patrón desde el inicio, con hecho o no hecho', () => {
    const d = datos({ registros: [hecho('a', '2026-11-09'), hecho('a', '2026-11-13')] });
    expect(fechas(d)).toEqual([
      '2026-11-09 true',
      '2026-11-11 false',
      '2026-11-13 true',
      '2026-11-16 false',
    ]);
  });

  it('hoy solo suma si ya se hizo', () => {
    expect(fechas(datos())).not.toContain('2026-11-18 false');
    expect(fechas(datos({ registros: [hecho('a', HOY)] }))).toContain('2026-11-18 true');
  });

  it('una movida cuenta en su fecha nueva y no en la original; una descartada cuenta como no hecha', () => {
    const ocurrencias: Ocurrencia[] = [
      { habit_id: 'a', fecha_original: '2026-11-11', fecha_nueva: '2026-11-12', estado: 'movida' },
      { habit_id: 'a', fecha_original: '2026-11-13', fecha_nueva: null, estado: 'descartada' },
    ];
    const d = datos({ ocurrencias, registros: [hecho('a', '2026-11-12')] });
    const lista = fechas(d);
    expect(lista).toContain('2026-11-12 true');
    expect(lista).not.toContain('2026-11-11 false');
    expect(lista).toContain('2026-11-13 false');
  });

  it('un archivado cuenta hasta el día anterior a archivarlo', () => {
    const d = datos({ habitos: [habito('a', { archivado_en: '2026-11-13T18:00:00' })] });
    expect(fechas(d)).toEqual(['2026-11-09 false', '2026-11-11 false']);
  });

  it('uno en pausa cuenta hasta su último registro', () => {
    const d = datos({
      habitos: [habito('a', { activo: false })],
      registros: [hecho('a', '2026-11-11')],
    });
    expect(fechas(d)).toEqual(['2026-11-09 false', '2026-11-11 true']);
    expect(fechas(datos({ habitos: [habito('a', { activo: false })] }))).toEqual([]);
  });

  it('un registro deshecho no cuenta como hecho', () => {
    const d = datos({
      registros: [{ habit_id: 'a', fecha: '2026-11-09', eliminado_en: '2026-11-09T10:00:00Z' }],
    });
    expect(fechas(d)[0]).toBe('2026-11-09 false');
  });

  it('sin horarios no hay historial', () => {
    expect(historial(datos({ horarios: [] }), HOY)).toEqual([]);
  });
});

describe('resumen del periodo', () => {
  const d = datos({
    habitos: [habito('a'), habito('b', { category_id: 'c-fisica' })],
    horarios: [horario('a'), horario('b', [1, 2])],
    registros: [hecho('a', '2026-11-16'), hecho('b', '2026-11-16'), hecho('a', HOY)],
  });
  const ocurrencias = historial(d, HOY);
  const semana = periodo('semana', HOY);
  const AREAS: Area[] = ['salud_fisica', 'trabajo', 'salud_mental'];

  it('cuenta el total y cada día de la semana', () => {
    const r = resumenDelPeriodo(d, ocurrencias, semana, AREAS);
    // Lunes 16: a y b hechos. Martes 17: b no hecho. Miércoles 18 (hoy): a hecho.
    expect(r.total).toEqual({ hechos: 3, total: 4 });
    expect(r.divisiones.slice(0, 4)).toEqual([
      { hechos: 2, total: 2 },
      { hechos: 0, total: 1 },
      { hechos: 1, total: 1 },
      { hechos: 0, total: 0 },
    ]);
  });

  it('agrupa los hábitos por área, en el orden de las áreas', () => {
    const r = resumenDelPeriodo(d, ocurrencias, semana, AREAS);
    expect(r.secciones.map((s) => [s.area, s.filas.map((f) => f.habito.id)])).toEqual([
      ['salud_fisica', ['b']],
      ['salud_mental', ['a']],
    ]);
  });

  it('cada hábito trae su conteo del periodo y su racha de todo el historial', () => {
    const r = resumenDelPeriodo(d, ocurrencias, semana, AREAS);
    const a = r.secciones.flatMap((s) => s.filas).find((f) => f.habito.id === 'a');
    // a: 9 no, 11 no, 13 no, 16 sí, 18 sí → racha actual 2.
    expect(a?.conteo).toEqual({ hechos: 2, total: 2 });
    expect(a?.racha).toEqual({ actual: 2, mejor: 2 });
    expect(rachasPorHabito(ocurrencias).get('a')).toEqual({ actual: 2, mejor: 2 });
  });

  it('sin filtro ofrece las áreas con hábitos y no filtra', () => {
    const r = resumenDelPeriodo(d, ocurrencias, semana, AREAS);
    expect(r.areas).toEqual(['salud_fisica', 'salud_mental']);
    expect(r.filtro).toBeNull();
  });

  it('con un área, el conteo y las secciones son solo de esa área', () => {
    const r = resumenDelPeriodo(d, ocurrencias, semana, AREAS, 'salud_fisica');
    // Solo b: lunes 16 hecho y martes 17 sin hacer.
    expect(r.filtro).toBe('salud_fisica');
    expect(r.total).toEqual({ hechos: 1, total: 2 });
    expect(r.divisiones.slice(0, 3)).toEqual([
      { hechos: 1, total: 1 },
      { hechos: 0, total: 1 },
      { hechos: 0, total: 0 },
    ]);
    expect(r.secciones.map((s) => s.area)).toEqual(['salud_fisica']);
    // Las opciones del filtro no cambian al filtrar.
    expect(r.areas).toEqual(['salud_fisica', 'salud_mental']);
  });

  it('un área sin hábitos en el periodo se ignora y se muestra todo', () => {
    const r = resumenDelPeriodo(d, ocurrencias, semana, AREAS, 'trabajo');
    expect(r.filtro).toBeNull();
    expect(r.total).toEqual({ hechos: 3, total: 4 });
    expect(r.secciones).toHaveLength(2);
  });

  it('un archivado sin días en el periodo no se lista; con días, sí', () => {
    const conArchivado = datos({
      habitos: [habito('a'), habito('z', { archivado_en: '2026-11-12T12:00:00' })],
      horarios: [horario('a'), horario('z')],
    });
    const occ = historial(conArchivado, HOY);
    const ids = (p: ReturnType<typeof periodo>) =>
      resumenDelPeriodo(conArchivado, occ, p, AREAS).secciones.flatMap((s) =>
        s.filas.map((f) => [f.habito.id, f.estado]),
      );
    expect(ids(semana)).toEqual([['a', 'activo']]);
    expect(ids(periodo('semana', HOY, -1))).toEqual([
      ['a', 'activo'],
      ['z', 'archivado'],
    ]);
  });
});

describe('estados por día', () => {
  const d = datos({
    habitos: [habito('a'), habito('p', { activo: false })],
    horarios: [horario('a'), horario('p')],
    ocurrencias: [
      { habit_id: 'a', fecha_original: '2026-11-13', fecha_nueva: '2026-11-14', estado: 'movida' },
    ],
    registros: [hecho('a', '2026-11-09'), hecho('p', '2026-11-11')],
  });

  it('pasado hecho o sin marcar, hoy pendiente y futuro «te toca»; la movida lleva su marca', () => {
    const a = estadosDelRango(d, '2026-11-09', '2026-11-20', HOY).get('a');
    expect(a?.get('2026-11-09')).toEqual({ estado: 'hecho', reprogramado: false });
    expect(a?.get('2026-11-11')).toEqual({ estado: 'sin_marcar', reprogramado: false });
    expect(a?.has('2026-11-13')).toBe(false);
    expect(a?.get('2026-11-14')).toEqual({ estado: 'sin_marcar', reprogramado: true });
    expect(a?.get(HOY)?.estado).toBe('pendiente');
    expect(a?.get('2026-11-20')?.estado).toBe('toca');
    expect(a?.has('2026-11-19')).toBe(false);
  });

  it('uno en pausa solo tiene días hasta su último registro', () => {
    const p = estadosDelRango(d, '2026-11-09', '2026-11-20', HOY).get('p');
    expect([...(p?.keys() ?? [])]).toEqual(['2026-11-09', '2026-11-11']);
  });

  it('el rango no empieza antes del primer horario', () => {
    expect(estadosDelRango(d, '2026-11-01', '2026-11-08', HOY).size).toBe(0);
  });

  it('lo de un día, con su área y su estado', () => {
    expect(habitosDeUnDia(d, HOY, HOY).map((i) => [i.habito.id, i.area, i.estado])).toEqual([
      ['a', 'salud_mental', 'pendiente'],
    ]);
    expect(habitosDeUnDia(d, '2026-11-11', HOY).map((i) => [i.habito.id, i.estado])).toEqual([
      ['a', 'sin_marcar'],
      ['p', 'hecho'],
    ]);
  });
});
