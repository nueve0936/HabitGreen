import {
  bajarNivel,
  cambiarHora,
  cambiarSegundoAviso,
  fechaDesdeHora,
  horaDesdeFecha,
  muestraNotaApoyo,
  muestraSegundoAviso,
  puedeBajarNivel,
  puedeQuitar,
  quitarHabito,
} from '../plan-review';
import { BORRADOR, RESPUESTAS } from '../__fixtures__/plan';

describe('revisión del plan', () => {
  it('cambiar la hora deja el aviso fijo y no toca el resto', () => {
    const flexible = {
      ...BORRADOR,
      habitos: BORRADOR.habitos.map((h) => ({ ...h, hora: null, flexible: true })),
    };
    const nuevo = cambiarHora(flexible, 'mover_mas', '07:15');
    expect(nuevo.habitos[0]).toMatchObject({ hora: '07:15', flexible: false });
    expect(nuevo.habitos[1]).toMatchObject({ hora: null, flexible: true });
    expect(flexible.habitos[0]?.hora).toBeNull();
  });

  it('bajar nivel usa la versión anterior y conserva la hora elegida', () => {
    const conHora = cambiarHora(BORRADOR, 'mover_mas', '19:00');
    const nuevo = bajarNivel(conHora, 'mover_mas');
    expect(nuevo.habitos[0]).toMatchObject({
      nivel: 1,
      titulo: 'Caminar 5 min',
      duracion_min: 5,
      hora: '19:00',
    });
  });

  it('en el nivel 1 no se puede bajar más', () => {
    expect(puedeBajarNivel(BORRADOR, 'mover_mas')).toBe(true);
    expect(puedeBajarNivel(BORRADOR, 'tiempo_de_calidad')).toBe(false);
    expect(bajarNivel(BORRADOR, 'tiempo_de_calidad')).toEqual(BORRADOR);
  });

  it('se puede quitar un hábito, pero el plan conserva al menos uno', () => {
    const uno = quitarHabito(BORRADOR, 'mover_mas');
    expect(uno.habitos.map((h) => h.objetivo)).toEqual(['tiempo_de_calidad']);
    expect(puedeQuitar(uno)).toBe(false);
    expect(quitarHabito(uno, 'tiempo_de_calidad')).toBe(uno);
  });

  it('el interruptor cambia el segundo aviso', () => {
    expect(cambiarSegundoAviso(BORRADOR, false).ajustes.segundo_aviso).toBe(false);
  });
});

describe('cuándo se muestra el interruptor «Segundo aviso» (SDD 5.6)', () => {
  it.each([
    ['olvido', 'recordatorio_suave', 'manana', true],
    ['olvido', 'minimo', 'manana', true],
    ['olvido', 'resumen_nocturno', 'manana', false],
    ['olvido', 'recordatorio_suave', 'varia', false],
    ['motivacion', 'recordatorio_suave', 'manana', false],
  ] as const)('%s + %s + %s → %s', (obstaculo, acompanamiento, momento, esperado) => {
    expect(muestraSegundoAviso({ ...RESPUESTAS, obstaculo, acompanamiento, momento })).toBe(
      esperado,
    );
  });
});

it('la nota de apoyo profesional solo aparece con «manejar_estres»', () => {
  expect(muestraNotaApoyo(BORRADOR)).toBe(false);
  const estres = {
    ...BORRADOR,
    habitos: [{ ...BORRADOR.habitos[0]!, objetivo: 'manejar_estres' as const }],
  };
  expect(muestraNotaApoyo(estres)).toBe(true);
});

it('convierte entre la hora "HH:MM" y la fecha del selector', () => {
  const fecha = fechaDesdeHora('07:05', new Date(2026, 10, 1, 15, 30));
  expect([fecha.getHours(), fecha.getMinutes(), fecha.getDate()]).toEqual([7, 5, 1]);
  expect(horaDesdeFecha(fecha)).toBe('07:05');
});
