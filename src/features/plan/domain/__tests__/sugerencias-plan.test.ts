import type { Respuestas } from '@/schemas/onboarding';

import type { ConfigPlan, FilaCatalogo } from '../plan-engine';
import { sugerenciasPorNiveles } from '../sugerencias-plan';

const fila = (objetivo: FilaCatalogo['objetivo'], nivel: 1 | 2 | 3, min: number): FilaCatalogo => ({
  objetivo,
  categoria: 'salud_mental',
  nivel,
  variante: 'base',
  titulo: `${objetivo} ${nivel}`,
  descripcion: null,
  duracion_min: min,
  duracion_reducida_min: min,
  dias_semana: [1, 3, 5],
  momento_fijo: null,
  sin_recursos: true,
});

const CATALOGO: FilaCatalogo[] = [
  fila('manejar_estres', 1, 2),
  fila('manejar_estres', 2, 5),
  fila('desconectar_pantallas', 1, 5),
  fila('desconectar_pantallas', 2, 15),
  fila('desconectar_pantallas', 3, 30),
  fila('tiempo_para_mi', 1, 5),
  fila('tiempo_para_mi', 2, 15),
  fila('tiempo_para_mi', 3, 30),
];

const CONFIG: ConfigPlan = {
  presupuestos: { menos_10: 10, '10_20': 20, '20_40': 40, mas_40: 60 },
  horas: { manana: '08:00', mediodia: '13:00', tarde: '17:00', noche: '20:30' },
};

const RESPUESTAS: Respuestas = {
  areas: ['salud_mental'],
  objetivos: [],
  historial: 'primera_vez',
  tiempo: '10_20',
  momento: 'noche',
  obstaculo: 'olvido',
  acompanamiento: 'recordatorio_suave',
};

describe('sugerencias para agregar un hábito al plan', () => {
  it('trae las 3 versiones de cada meta libre, primero las más ligeras', () => {
    const lista = sugerenciasPorNiveles(RESPUESTAS, CATALOGO, CONFIG, new Set(['manejar_estres']));
    expect(lista.map((h) => [h.objetivo, h.nivel])).toEqual([
      ['desconectar_pantallas', 1],
      ['tiempo_para_mi', 1],
      ['desconectar_pantallas', 2],
      ['tiempo_para_mi', 2],
      ['desconectar_pantallas', 3],
      ['tiempo_para_mi', 3],
    ]);
  });

  it('no sugiere metas de otras áreas', () => {
    const otraArea = { ...RESPUESTAS, areas: ['finanzas' as const] };
    expect(sugerenciasPorNiveles(otraArea, CATALOGO, CONFIG, new Set())).toEqual([]);
  });
});
