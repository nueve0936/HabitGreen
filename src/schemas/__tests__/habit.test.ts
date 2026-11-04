import { es } from '@/i18n/es';

import { habitoFormSchema, type HabitoFormInput } from '../habit';

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
    expect(errores({ nombre: 'a'.repeat(61) })).toEqual([e.nombreLargo]);
  });

  it.each([0, 121, 1.5])('rechaza la duración %j', (duracion) => {
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
