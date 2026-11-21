import type { Habito, Horario } from '@/features/habits/domain/habitos-del-dia';
import type { ConfigPlan, FilaCatalogo } from '@/features/plan/domain/plan-engine';
import type { OcurrenciaEstadistica } from '@/features/stats/domain/cumplimiento';
import { sumarDias } from '@/lib/dates';
import type { Respuestas } from '@/schemas/onboarding';

import {
  cumplimientoDe,
  decidir,
  PROGRESION_POR_DEFECTO,
  tocaDesbloquear,
  tocaEvaluar,
  type EntradaProgresion,
  type Tarjeta,
} from '../progresion';

// Hoy es miércoles 2026-11-18. La ventana normal va del 4 al 17 de noviembre (14 días).
const HOY = '2026-11-18';
const CONFIG = PROGRESION_POR_DEFECTO;

function fila(
  objetivo: FilaCatalogo['objetivo'],
  nivel: 1 | 2 | 3,
  titulo: string,
  duracion: number,
  reducida: number,
  dias: number[],
  categoria: FilaCatalogo['categoria'] = 'salud_fisica',
): FilaCatalogo {
  return {
    objetivo,
    categoria,
    nivel,
    variante: 'base',
    titulo,
    descripcion: null,
    duracion_min: duracion,
    duracion_reducida_min: reducida,
    dias_semana: dias,
    momento_fijo: null,
    sin_recursos: true,
  };
}

const TODOS = [1, 2, 3, 4, 5, 6, 7];
const CATALOGO: FilaCatalogo[] = [
  fila('mover_mas', 1, 'Caminar 5 min', 5, 2, TODOS),
  fila('mover_mas', 2, 'Caminar 15 min', 15, 5, TODOS),
  fila('mover_mas', 3, 'Caminar o moverme 30 min', 30, 10, TODOS),
  fila('dormir_mejor', 1, 'Acostarme a la misma hora', 2, 1, TODOS),
  fila('saber_gastos', 1, 'Anotar un gasto del día', 2, 1, TODOS, 'finanzas'),
];

const RESPUESTAS: Respuestas = {
  areas: ['salud_fisica', 'finanzas'],
  objetivos: ['mover_mas', 'saber_gastos'],
  historial: 'empieza_y_deja',
  tiempo: '20_40',
  momento: 'manana',
  obstaculo: 'olvido',
  acompanamiento: 'recordatorio_suave',
};

const CONFIG_PLAN: ConfigPlan = {
  presupuestos: { menos_10: 10, '10_20': 20, '20_40': 40, mas_40: 60 },
  horas: { manana: '08:00', mediodia: '13:00', tarde: '17:00', noche: '20:30' },
};

function habito(id: string, cambios: Partial<Habito> = {}): Habito {
  return {
    id,
    category_id: 'c-fisica',
    plan_id: 'p1',
    objetivo: 'mover_mas',
    nivel: 2,
    usa_duracion_reducida: false,
    nivel_desde: null,
    titulo: 'Caminar 15 min',
    descripcion: null,
    duracion_min: 15,
    activo: true,
    archivado_en: null,
    ...cambios,
  };
}

function horario(habitId: string, dias: number[] = TODOS): Horario {
  return {
    id: `h-${habitId}`,
    habit_id: habitId,
    dias_semana: dias,
    hora: '08:00',
    flexible: false,
    notificar: true,
    vigente_desde: '2026-08-01',
    vigente_hasta: null,
  };
}

/** Un día por ocurrencia, hacia atrás desde ayer; las primeras `hechos` (las más recientes) hechas. */
function ocurrencias(habitId: string, hechos: number, total: number, cada = 1) {
  return Array.from({ length: total }, (_, i) => ({
    habitId,
    fecha: sumarDias(HOY, -1 - i * cada),
    hecho: i < hechos,
  }));
}

function entrada(cambios: Partial<EntradaProgresion> = {}): EntradaProgresion {
  return {
    hoy: HOY,
    habitos: [habito('a')],
    horarios: [horario('a')],
    ocurrencias: [],
    catalogo: CATALOGO,
    respuestas: RESPUESTAS,
    configPlan: CONFIG_PLAN,
    presupuestoMin: 60,
    limiteDesbloqueado: false,
    subidasPlan: 0,
    config: CONFIG,
    ...cambios,
  };
}

const tipos = (t: Tarjeta[]) => t.map((x) => x.tipo);

describe('cuándo se revisa', () => {
  it('cada 7 días desde la última revisión o desde el inicio del plan', () => {
    expect(tocaEvaluar(HOY, null, '2026-11-11', CONFIG)).toBe(true);
    expect(tocaEvaluar(HOY, null, '2026-11-12', CONFIG)).toBe(false);
    expect(tocaEvaluar(HOY, '2026-11-11', '2026-08-01', CONFIG)).toBe(true);
    expect(tocaEvaluar(HOY, '2026-11-15', '2026-08-01', CONFIG)).toBe(false);
    expect(tocaEvaluar(HOY, null, null, CONFIG)).toBe(false);
  });
});

describe('ventana de cumplimiento', () => {
  it('últimos 14 días hasta ayer; hoy no cuenta', () => {
    const occ = [...ocurrencias('a', 10, 20), { habitId: 'a', fecha: HOY, hecho: true }];
    expect(cumplimientoDe(habito('a'), 7, occ, HOY, CONFIG)).toEqual({ hechos: 10, total: 14 });
  });

  it('con 1 o 2 días por semana usa 28 días', () => {
    // Una cada 3 días: en 28 días caben las 8; en 14, solo 5.
    const occ = ocurrencias('a', 6, 8, 3);
    expect(cumplimientoDe(habito('a'), 2, occ, HOY, CONFIG)).toEqual({ hechos: 6, total: 8 });
    expect(cumplimientoDe(habito('a'), 3, occ, HOY, CONFIG)).toEqual({ hechos: 5, total: 5 });
  });

  it('solo cuenta desde el último cambio de nivel', () => {
    const occ = ocurrencias('a', 4, 14);
    expect(cumplimientoDe(habito('a', { nivel_desde: '2026-11-14' }), 7, occ, HOY, CONFIG)).toEqual(
      { hechos: 4, total: 4 },
    );
  });

  it('con menos de 4 ocurrencias no se evalúa', () => {
    const occ = ocurrencias('a', 3, 14);
    expect(
      cumplimientoDe(habito('a', { nivel_desde: '2026-11-15' }), 7, occ, HOY, CONFIG),
    ).toBeNull();
  });
});

describe('tabla de 6.3', () => {
  const con = (
    hechos: number,
    total: number,
    config = CONFIG,
    extra: Partial<EntradaProgresion> = {},
  ) => decidir(entrada({ ocurrencias: ocurrencias('a', hechos, total), config, ...extra }));

  it('90 %: sube un nivel', () => {
    const [t] = con(13, 14);
    expect(t).toMatchObject({
      tipo: 'subir',
      habitId: 'a',
      antes: { nivel: 2, duracion_min: 15 },
      despues: { nivel: 3, titulo: 'Caminar o moverme 30 min', duracion_min: 30, nivel_desde: HOY },
    });
  });

  it('85 % justo sube; 84 % se mantiene', () => {
    expect(tipos(con(17, 20, { ...CONFIG, ventana_dias: 20 }))).toEqual(['subir']);
    expect(con(21, 25, { ...CONFIG, ventana_dias: 25 })).toEqual([]);
  });

  it('50 % se mantiene; 49 % baja un nivel', () => {
    expect(con(7, 14)).toEqual([]);
    expect(tipos(con(49, 100, { ...CONFIG, ventana_dias: 100 }))).toEqual(['bajar']);
    const [t] = con(6, 14);
    expect(t).toMatchObject({ tipo: 'bajar', despues: { nivel: 1, duracion_min: 5 } });
  });

  it('en el nivel 1 baja a la versión corta; si ya la usa, solo apoyo', () => {
    const nivel1 = habito('a', { nivel: 1, duracion_min: 5, titulo: 'Caminar 5 min' });
    const [t] = decidir(entrada({ habitos: [nivel1], ocurrencias: ocurrencias('a', 2, 14) }));
    expect(t).toMatchObject({
      tipo: 'bajar',
      despues: { nivel: 1, duracion_min: 2, usa_duracion_reducida: true },
    });

    const corto = { ...nivel1, usa_duracion_reducida: true, duracion_min: 2 };
    const [apoyo] = decidir(entrada({ habitos: [corto], ocurrencias: ocurrencias('a', 2, 14) }));
    expect(apoyo).toMatchObject({ tipo: 'apoyo', habitId: 'a' });
  });

  it('un hábito sin duración en el nivel 1 no tiene versión corta: solo apoyo', () => {
    const recordatorio = habito('a', {
      nivel: 1,
      duracion_min: 0,
      titulo: 'Tomar un vaso de agua',
    });
    const [t] = decidir(entrada({ habitos: [recordatorio], ocurrencias: ocurrencias('a', 2, 14) }));
    expect(t).toMatchObject({ tipo: 'apoyo', habitId: 'a' });
  });

  it('desde la versión corta, primero vuelve a la normal; con poco_tiempo sube de nivel', () => {
    const corto = habito('a', {
      nivel: 1,
      usa_duracion_reducida: true,
      duracion_min: 2,
      titulo: 'Caminar 5 min',
    });
    const [t] = decidir(entrada({ habitos: [corto], ocurrencias: ocurrencias('a', 14, 14) }));
    expect(t).toMatchObject({
      tipo: 'subir',
      despues: { nivel: 1, duracion_min: 5, usa_duracion_reducida: false },
    });

    const poco = { ...RESPUESTAS, obstaculo: 'poco_tiempo' as const };
    const [t2] = decidir(
      entrada({ habitos: [corto], respuestas: poco, ocurrencias: ocurrencias('a', 14, 14) }),
    );
    expect(t2).toMatchObject({
      tipo: 'subir',
      despues: { nivel: 2, duracion_min: 5, usa_duracion_reducida: true },
    });
  });
});

describe('hábito nuevo y presupuesto', () => {
  const bien = ocurrencias('a', 14, 14);

  it('en el nivel 3 propone un hábito nuevo de tus áreas', () => {
    const nivel3 = habito('a', { nivel: 3, duracion_min: 30 });
    const [t] = decidir(entrada({ habitos: [nivel3], ocurrencias: bien }));
    expect(t).toMatchObject({ tipo: 'nuevo', habito: { objetivo: 'dormir_mejor', nivel: 1 } });
  });

  it('con un plan por área, solo revisa los hábitos de ese plan', () => {
    const otro = habito('b', {
      plan_id: 'p2',
      objetivo: 'saber_gastos',
      category_id: 'c-finanzas',
    });
    const t = decidir(
      entrada({
        planId: 'p1',
        habitos: [habito('a'), otro],
        horarios: [horario('a'), horario('b')],
        ocurrencias: [...bien, ...ocurrencias('b', 14, 14)],
      }),
    );
    expect(t.map((x) => x.id)).toEqual(['subir-a']);
  });

  it('con un plan por área, el hábito nuevo solo se busca en esa área', () => {
    const nivel3 = habito('a', { nivel: 3, duracion_min: 30 });
    const dormir = habito('d', { objetivo: 'dormir_mejor', nivel: 1, duracion_min: 2 });
    const datos = {
      habitos: [nivel3, dormir],
      horarios: [horario('a'), horario('d')],
      ocurrencias: bien,
      respuestas: { ...RESPUESTAS, areas: ['salud_fisica' as const] },
    };
    // Sin plan concreto se iría a otra área (finanzas); con el plan de Salud Física, no.
    expect(decidir(entrada(datos))).toMatchObject([{ habito: { objetivo: 'saber_gastos' } }]);
    const conPlan = decidir(entrada({ ...datos, planId: 'p1' }));
    expect(conPlan.every((t) => t.tipo !== 'nuevo' || t.habito.categoria === 'salud_fisica')).toBe(
      true,
    );
  });

  it('si el siguiente nivel no cabe, propone un hábito nuevo; si tampoco cabe, «sin espacio»', () => {
    // Nivel 3 (30 min) no cabe en 20; un hábito nuevo de 2 min sí (15 + 2).
    expect(decidir(entrada({ ocurrencias: bien, presupuestoMin: 20 }))).toMatchObject([
      { tipo: 'nuevo' },
    ]);
    // Con 15 no cabe ni el nivel ni un hábito nuevo.
    expect(tipos(decidir(entrada({ ocurrencias: bien, presupuestoMin: 15 })))).toEqual([
      'sin_espacio',
    ]);
  });

  it('no repite un objetivo que ya está en el plan', () => {
    const nivel3 = habito('a', { nivel: 3, duracion_min: 30 });
    const dormir = habito('d', { objetivo: 'dormir_mejor', nivel: 1, duracion_min: 2 });
    const [t] = decidir(
      entrada({
        habitos: [nivel3, dormir],
        horarios: [horario('a'), horario('d')],
        ocurrencias: bien,
      }),
    );
    expect(t).toMatchObject({ tipo: 'nuevo', habito: { objetivo: 'saber_gastos' } });
  });

  it('una sola propuesta de hábito nuevo por revisión', () => {
    const a = habito('a', { nivel: 3, duracion_min: 30 });
    const b = habito('b', { objetivo: 'saber_gastos', nivel: 3, duracion_min: 5 });
    const t = decidir(
      entrada({
        habitos: [a, b],
        horarios: [horario('a'), horario('b')],
        ocurrencias: [...bien, ...ocurrencias('b', 14, 14)],
      }),
    );
    expect(tipos(t)).toEqual(['nuevo']);
  });

  it('con el límite total de hábitos alcanzado no propone otro, salvo con una subida más', () => {
    const a = habito('a', { nivel: 3, duracion_min: 5 });
    const b = habito('b', { objetivo: 'saber_gastos', nivel: 3, duracion_min: 5 });
    const propio = habito('m', { objetivo: null, nivel: null, plan_id: null, duracion_min: 5 });
    const datos = {
      habitos: [a, b, propio],
      horarios: [horario('a'), horario('b'), horario('m')],
      ocurrencias: [...ocurrencias('a', 14, 14), ...ocurrencias('b', 14, 14)],
    };
    expect(decidir(entrada(datos))).toEqual([]);
    expect(tipos(decidir(entrada({ ...datos, subidasPlan: 1 })))).toEqual(['nuevo']);
  });

  it('con 4 hábitos del plan no propone otro, salvo con el límite desbloqueado', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const habitos = ids.map((id) => habito(id, { nivel: 3, duracion_min: 5 }));
    const datos = {
      habitos,
      horarios: ids.map((id) => horario(id)),
      ocurrencias: ids.flatMap((id) => ocurrencias(id, 14, 14)),
    };
    expect(decidir(entrada(datos))).toEqual([]);
    expect(tipos(decidir(entrada({ ...datos, limiteDesbloqueado: true })))).toEqual(['nuevo']);
  });

  it('los hábitos manuales nunca suben ni bajan', () => {
    const manual = habito('m', { objetivo: null, nivel: null, plan_id: null });
    expect(
      decidir(
        entrada({
          habitos: [manual],
          horarios: [horario('m')],
          ocurrencias: ocurrencias('m', 0, 14),
        }),
      ),
    ).toEqual([]);
  });

  it('los pausados y archivados no se revisan', () => {
    const pausado = habito('a', { activo: false });
    expect(decidir(entrada({ habitos: [pausado], ocurrencias: ocurrencias('a', 0, 14) }))).toEqual(
      [],
    );
  });
});

describe('desbloqueo del límite', () => {
  const occ = (hechos: number): OcurrenciaEstadistica[] => ocurrencias('a', hechos, 28);

  it('a los 90 días del plan con 85 % o más en los últimos 28 días', () => {
    const inicio = sumarDias(HOY, -90);
    expect(tocaDesbloquear(HOY, inicio, false, [habito('a')], occ(25), CONFIG)).toBe(true);
    expect(tocaDesbloquear(HOY, inicio, false, [habito('a')], occ(20), CONFIG)).toBe(false);
    expect(tocaDesbloquear(HOY, sumarDias(HOY, -89), false, [habito('a')], occ(28), CONFIG)).toBe(
      false,
    );
    expect(tocaDesbloquear(HOY, inicio, true, [habito('a')], occ(28), CONFIG)).toBe(false);
  });
});
