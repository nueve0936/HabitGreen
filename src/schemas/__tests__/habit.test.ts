import { es } from '@/i18n/es';

import { habitoFormSchema, type HabitoFormInput } from '../habit';

const e = es.habitForm.errores;

const valido: HabitoFormInput = {
  nombre: '  Caminar 10 minutos ',
  descripcion: '',
  categoria: 'salud_fisica',
  frecuencia: 'semana',
  dias: [5, 1, 3, 1],
  duracion: '10',
  hora: '08:00',
  avisarme: true,
};

function errores(cambios: Partial<HabitoFormInput>): string[] {
  const r = habitoFormSchema.safeParse({ ...valido, ...cambios });
  return r.success ? [] : r.error.issues.map((i) => i.message);
}

describe('formulario de hábito', () => {
  it('limpia y convierte los valores', () => {
    expect(habitoFormSchema.parse(valido)).toEqual({
      nombre: 'Caminar 10 minutos',
      descripcion: null,
      categoria: 'salud_fisica',
      dias_semana: [1, 3, 5],
      duracion: 10,
      hora: '08:00',
      avisarme: true,
    });
  });

  it('«Todos los días» ignora los días marcados', () => {
    expect(
      habitoFormSchema.parse({ ...valido, frecuencia: 'todos', dias: [] }).dias_semana,
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('pide elegir una categoría', () => {
    expect(errores({ categoria: null })).toEqual([e.categoria]);
  });

  it('pide al menos un día con días específicos', () => {
    expect(errores({ dias: [] })).toEqual([e.dias]);
  });

  it('valida el largo del nombre', () => {
    expect(errores({ nombre: ' ab ' })).toEqual([e.nombreCorto]);
    expect(errores({ nombre: 'a'.repeat(61) })).toEqual([e.nombreLargo]);
  });

  it.each(['0', '121', 'diez', '', '1.5'])('rechaza la duración %j', (duracion) => {
    expect(errores({ duracion })).toEqual([e.duracion]);
  });

  it('valida la hora y admite nula (aviso flexible)', () => {
    expect(errores({ hora: '24:00' })).toEqual([e.hora]);
    expect(errores({ hora: null })).toEqual([]);
  });
});
