import { leerRespuestaIa } from '../plan';

const OBJETIVOS = ['mover_mas', 'tiempo_de_calidad'];

function respuesta(
  habitos: { objetivo: string; titulo?: string }[],
  resumen = 'Empezamos ligero.',
) {
  return {
    resumen,
    habitos: habitos.map((h) => ({ titulo: 'Caminar 5 min', descripcion: 'Sin prisa.', ...h })),
  };
}

describe('respuesta de la IA (SDD 5.9)', () => {
  it('acepta exactamente los objetivos pedidos, en cualquier orden', () => {
    const json = respuesta([{ objetivo: 'tiempo_de_calidad' }, { objetivo: 'mover_mas' }]);
    expect(leerRespuestaIa(json, OBJETIVOS)).not.toBeNull();
  });

  it.each([
    ['falta un objetivo', respuesta([{ objetivo: 'mover_mas' }])],
    ['objetivo repetido', respuesta([{ objetivo: 'mover_mas' }, { objetivo: 'mover_mas' }])],
    ['objetivo no pedido', respuesta([{ objetivo: 'mover_mas' }, { objetivo: 'dormir_mejor' }])],
    ['objetivo inventado', respuesta([{ objetivo: 'mover_mas' }, { objetivo: 'volar' }])],
    [
      'título muy largo',
      respuesta([
        { objetivo: 'mover_mas', titulo: 'x'.repeat(61) },
        { objetivo: 'tiempo_de_calidad' },
      ]),
    ],
    [
      'resumen muy largo',
      respuesta([{ objetivo: 'mover_mas' }, { objetivo: 'tiempo_de_calidad' }], 'x'.repeat(301)),
    ],
    ['no es un objeto', 'texto suelto'],
  ])('rechaza: %s', (_caso, json) => {
    expect(leerRespuestaIa(json, OBJETIVOS)).toBeNull();
  });
});
