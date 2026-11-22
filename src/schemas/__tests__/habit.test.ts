import { es, formatear } from '@/i18n/es';

import {
  crearHabitoFormSchema,
  habitoFormSchema,
  limitesDeTexto,
  type HabitoFormInput,
} from '../habit';

const e = es.habitForm.errores;

const valido: HabitoFormInput = {
  nombre: '  Caminar 10 minutos ',
  descripcion: '',
  categoria: 'salud_fisica',
  dias: [5, 1, 3, 1],
  duracion: 10,
  hora: '08:00',
  notificar: true,
  flexible: false,
  fecha_inicio: '2026-11-03',
  fecha_fin: null,
};

function errores(cambios: Partial<HabitoFormInput>): string[] {
  const r = habitoFormSchema.safeParse({ ...valido, ...cambios });
  return r.success ? [] : r.error.issues.map((i) => i.message);
}

describe('asistente de hábito', () => {
  it('limpia y convierte los valores', () => {
    expect(habitoFormSchema.parse(valido)).toEqual({
      nombre: 'Caminar 10 minutos',
      descripcion: null,
      categoria: 'salud_fisica',
      dias_semana: [1, 3, 5],
      duracion: 10,
      hora: '08:00',
      notificar: true,
      fecha_inicio: '2026-11-03',
      fecha_fin: null,
    });
  });

  it('pide categoría y al menos un día', () => {
    expect(errores({ categoria: null })).toEqual([e.categoria]);
    expect(errores({ dias: [] })).toEqual([e.dias]);
  });

  it('valida el largo del nombre', () => {
    expect(errores({ nombre: ' ab ' })).toEqual([e.nombreCorto]);
    expect(errores({ nombre: 'a'.repeat(31) })).toEqual([formatear(e.nombreLargo, { n: 30 })]);
    expect(errores({ nombre: 'a'.repeat(30) })).toEqual([]);
    expect(errores({ descripcion: 'a'.repeat(101) })).toEqual([
      formatear(e.descripcionLarga, { n: 100 }),
    ]);
    expect(errores({ descripcion: 'a'.repeat(100) })).toEqual([]);
  });

  it.each([0, 25, 1439])('acepta la duración %j (0 es «Sin duración fija»)', (duracion) => {
    expect(errores({ duracion })).toEqual([]);
  });

  it.each([-1, 1440, 1.5])('rechaza la duración %j', (duracion) => {
    expect(errores({ duracion })).toEqual([e.duracion]);
  });

  it('sin recordatorio no necesita hora; con aviso sí, salvo el flexible del plan', () => {
    expect(errores({ hora: null, notificar: false })).toEqual([]);
    expect(errores({ hora: null, notificar: true })).toEqual([e.hora]);
    expect(errores({ hora: null, notificar: true, flexible: true })).toEqual([]);
  });

  it('la fecha de fin no puede ser anterior a la de inicio', () => {
    expect(errores({ fecha_fin: '2026-11-02' })).toEqual([e.fechaFin]);
    expect(errores({ fecha_fin: '2026-11-03' })).toEqual([]);
  });
});

describe('límites de texto (decisión del usuario: 30 y 100)', () => {
  it('al crear, 30 para el nombre y 100 para la descripción', () => {
    expect(limitesDeTexto()).toEqual({ nombre: 30, descripcion: 100 });
  });

  it('al editar, un texto más largo se respeta pero no crece', () => {
    const largo = 'Revisión semanal de ahorro y gastos pequeños'; // 44
    const limites = limitesDeTexto({ nombre: largo, descripcion: null });
    expect(limites).toEqual({ nombre: largo.length, descripcion: 100 });
    const esquema = crearHabitoFormSchema(limites);
    expect(esquema.safeParse({ ...valido, nombre: largo }).success).toBe(true);
    expect(esquema.safeParse({ ...valido, nombre: largo + 'x' }).success).toBe(false);
  });

  it('los mensajes dicen el límite', () => {
    expect(es.habitForm.errores.nombreLargo).toContain('{n}');
  });
});
