import type {
  Habito,
  Horario,
  Ocurrencia,
  Registro,
} from '@/features/habits/domain/habitos-del-dia';

import {
  diasLibres,
  pendientesDeReprogramar,
  propuestasDeReprogramacion,
  type DatosReprogramar,
} from '../reprogramar';

// Hoy es miércoles 2026-11-18 (ISO 3). Se revisan del miércoles 11 al martes 17 y se puede mover
// del miércoles 18 al miércoles 25.
const HOY = '2026-11-18';

function habito(id: string, cambios: Partial<Habito> = {}): Habito {
  return {
    id,
    category_id: 'c1',
    plan_id: null,
    titulo: `Hábito ${id}`,
    descripcion: null,
    duracion_min: 5,
    activo: true,
    archivado_en: null,
    ...cambios,
  };
}

function horario(habitId: string, cambios: Partial<Horario> = {}): Horario {
  return {
    id: `s-${habitId}`,
    habit_id: habitId,
    // Lunes, miércoles y viernes.
    dias_semana: [1, 3, 5],
    hora: '08:00',
    flexible: false,
    notificar: true,
    vigente_desde: '2026-10-01',
    vigente_hasta: null,
    ...cambios,
  };
}

function datos(cambios: Partial<DatosReprogramar> = {}): DatosReprogramar {
  return {
    habitos: [habito('a')],
    horarios: [horario('a')],
    ocurrencias: [],
    registros: [],
    presupuesto: 60,
    ...cambios,
  };
}

const hecho = (habitId: string, fecha: string): Registro => ({
  habit_id: habitId,
  fecha,
  eliminado_en: null,
});

describe('qué se ofrece reprogramar (SDD 6.2)', () => {
  it('ofrece el día más reciente sin hacer y guarda los anteriores', () => {
    const [pendiente, ...resto] = pendientesDeReprogramar(datos(), HOY);
    expect(resto).toHaveLength(0);
    expect(pendiente.habito.id).toBe('a');
    expect(pendiente.fechaOriginal).toBe('2026-11-16');
    expect(pendiente.anteriores).toEqual(['2026-11-11', '2026-11-13']);
  });

  it('no cuenta los días hechos', () => {
    const [pendiente] = pendientesDeReprogramar(
      datos({ registros: [hecho('a', '2026-11-16')] }),
      HOY,
    );
    expect(pendiente.fechaOriginal).toBe('2026-11-13');
    expect(pendiente.anteriores).toEqual(['2026-11-11']);
  });

  it('no vuelve a ofrecer días que ya tienen ocurrencia', () => {
    const ocurrencias: Ocurrencia[] = ['2026-11-11', '2026-11-13', '2026-11-16'].map((f) => ({
      habit_id: 'a',
      fecha_original: f,
      fecha_nueva: null,
      estado: 'descartada',
    }));
    expect(pendientesDeReprogramar(datos({ ocurrencias }), HOY)).toEqual([]);
  });

  it('un hábito que llegó movido y no se hizo no se vuelve a mover', () => {
    const resultado = pendientesDeReprogramar(
      datos({
        // Jueves, desde el día 13: en la ventana no le toca ningún día por su patrón.
        horarios: [horario('a', { dias_semana: [4], vigente_desde: '2026-11-13' })],
        ocurrencias: [
          {
            habit_id: 'a',
            fecha_original: '2026-11-13',
            fecha_nueva: '2026-11-14',
            estado: 'movida',
          },
        ],
      }),
      HOY,
    );
    expect(resultado).toEqual([]);
  });

  it('omite en silencio los hábitos de los 7 días', () => {
    const horarios = [horario('a', { dias_semana: [1, 2, 3, 4, 5, 6, 7] })];
    expect(pendientesDeReprogramar(datos({ horarios }), HOY)).toEqual([]);
  });

  it('no cuenta hoy ni los días antes de que empiece el hábito', () => {
    const horarios = [horario('a', { vigente_desde: HOY })];
    expect(pendientesDeReprogramar(datos({ horarios }), HOY)).toEqual([]);
  });

  it('no ofrece hábitos pausados', () => {
    const habitos = [habito('a', { activo: false })];
    expect(pendientesDeReprogramar(datos({ habitos }), HOY)).toEqual([]);
  });
});

describe('días libres', () => {
  it('son los días fuera del patrón, de hoy a 7 días adelante', () => {
    // Hoy miércoles y el lunes y miércoles siguientes son de su patrón.
    expect(diasLibres(habito('a'), datos(), HOY)).toEqual([
      '2026-11-19',
      '2026-11-21',
      '2026-11-22',
      '2026-11-24',
    ]);
  });

  it('respeta la fecha de fin del hábito', () => {
    const horarios = [horario('a', { vigente_hasta: '2026-11-20' })];
    expect(diasLibres(habito('a'), datos({ horarios }), HOY)).toEqual(['2026-11-19']);
  });

  it('salta los días a los que ya llega otra ocurrencia del mismo hábito', () => {
    const ocurrencias: Ocurrencia[] = [
      { habit_id: 'a', fecha_original: '2026-11-09', fecha_nueva: '2026-11-19', estado: 'movida' },
    ];
    expect(diasLibres(habito('a'), datos({ ocurrencias }), HOY)[0]).toBe('2026-11-21');
  });

  it('no pasa del tiempo diario', () => {
    // «b» llena el jueves (10 de 10 min) desde hoy, así que no tiene pendientes.
    const d = datos({
      habitos: [habito('a'), habito('b', { duracion_min: 10 })],
      horarios: [horario('a'), horario('b', { dias_semana: [4], vigente_desde: HOY })],
      presupuesto: 10,
    });
    expect(diasLibres(habito('a'), d, HOY)[0]).toBe('2026-11-21');
  });

  it('un hábito sin duración fija siempre cabe', () => {
    const d = datos({
      habitos: [habito('a', { duracion_min: 0 }), habito('b', { duracion_min: 10 })],
      horarios: [horario('a'), horario('b', { dias_semana: [4], vigente_desde: HOY })],
      presupuesto: 10,
    });
    expect(diasLibres(habito('a', { duracion_min: 0 }), d, HOY)[0]).toBe('2026-11-19');
  });
});

describe('propuestas', () => {
  it('propone el primer día libre', () => {
    const [propuesta] = propuestasDeReprogramacion(datos(), HOY);
    expect(propuesta.diaPropuesto).toBe('2026-11-19');
    expect(propuesta.diasLibres).toContain('2026-11-24');
  });

  it('cuenta las propuestas anteriores para no pasar del tiempo diario', () => {
    // «b» (10 min, jueves y sábado) es la más antigua: va primero y ocupa el domingo.
    const d = datos({
      habitos: [habito('a'), habito('b', { duracion_min: 10 })],
      horarios: [horario('a'), horario('b', { dias_semana: [4, 6] })],
      presupuesto: 10,
    });
    const propuestas = propuestasDeReprogramacion(d, HOY);
    expect(propuestas.map((p) => [p.habito.id, p.fechaOriginal, p.diaPropuesto])).toEqual([
      ['b', '2026-11-14', '2026-11-22'],
      ['a', '2026-11-16', '2026-11-24'],
    ]);
  });

  it('sin días libres, la propuesta queda sin día', () => {
    const horarios = [horario('a', { vigente_hasta: HOY })];
    const [propuesta] = propuestasDeReprogramacion(datos({ horarios }), HOY);
    expect(propuesta.diaPropuesto).toBeNull();
    expect(propuesta.diasLibres).toEqual([]);
  });
});
