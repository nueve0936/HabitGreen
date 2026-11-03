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
  agregarHabito,
  editarHabitoPlan,
  paginaDeSugerencias,
  puedeAgregar,
  sugerenciasDisponibles,
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

describe('agregar y editar hábitos en la revisión', () => {
  it('las sugerencias omiten los objetivos que ya están en el plan', () => {
    expect(sugerenciasDisponibles(BORRADOR).map((h) => h.objetivo)).toEqual([
      'dormir_mejor',
      'tomar_agua',
    ]);
  });

  it('pagina de 4 en 4 y vuelve al principio', () => {
    const lista = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(paginaDeSugerencias(lista, 0)).toEqual([1, 2, 3, 4]);
    expect(paginaDeSugerencias(lista, 2)).toEqual([9]);
    expect(paginaDeSugerencias(lista, 3)).toEqual([1, 2, 3, 4]);
    expect(paginaDeSugerencias([1, 2], 5)).toEqual([1, 2]);
  });

  it('agrega hasta 3 hábitos y no repite objetivos', () => {
    const [dormir, , agua] = BORRADOR.sugerencias;
    const con3 = agregarHabito(BORRADOR, dormir!);
    expect(con3.habitos).toHaveLength(3);
    expect(puedeAgregar(con3)).toBe(false);
    expect(agregarHabito(con3, agua!)).toBe(con3);
    expect(agregarHabito(BORRADOR, BORRADOR.habitos[0]!)).toBe(BORRADOR);
  });

  it('si se pasa del tiempo diario, este sube a la suma del día más cargado', () => {
    const justo = { ...BORRADOR, ajustes: { ...BORRADOR.ajustes, presupuesto_min: 20 } };
    // Lunes: 15 + 5 + 2 = 22 min.
    expect(agregarHabito(justo, BORRADOR.sugerencias[0]!).ajustes.presupuesto_min).toBe(22);
  });

  it('editar cambia nombre, días, hora y aviso; sin hora conserva la anterior', () => {
    const editado = editarHabitoPlan(BORRADOR, 'mover_mas', {
      titulo: 'Caminar al parque',
      dias_semana: [6, 1],
      hora: '19:30',
      notificar: false,
    });
    expect(editado.habitos[0]).toMatchObject({
      titulo: 'Caminar al parque',
      dias_semana: [1, 6],
      hora: '19:30',
      flexible: false,
      notificar: false,
    });
    const flexible = {
      ...BORRADOR,
      habitos: [{ ...BORRADOR.habitos[0]!, hora: null, flexible: true }],
    };
    expect(
      editarHabitoPlan(flexible, 'mover_mas', {
        titulo: 'Caminar',
        dias_semana: [1],
        hora: null,
        notificar: true,
      }).habitos[0],
    ).toMatchObject({ hora: null, flexible: true });
  });
});
