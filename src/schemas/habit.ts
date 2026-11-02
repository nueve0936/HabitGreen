import { z } from 'zod';

import { es } from '@/i18n/es';

import { AREAS } from './onboarding';

// Formulario de crear y editar hábito (SDD 6.5). La frecuencia solo admite días de la semana:
// es lo que guarda `habit_schedules.dias_semana`. Por mes, por año o «cada cierto tiempo» quedan
// para después de la demo.

const e = es.habitForm.errores;

export const NOMBRE_MIN = 3;
export const NOMBRE_MAX = 60;
export const DESCRIPCION_MAX = 140;
export const DURACION_MAX = 120;

export const FRECUENCIAS = ['todos', 'semana'] as const;
export const TODOS_LOS_DIAS = [1, 2, 3, 4, 5, 6, 7];

export const habitoFormSchema = z
  .object({
    nombre: z.string().trim().min(NOMBRE_MIN, e.nombreCorto).max(NOMBRE_MAX, e.nombreLargo),
    descripcion: z
      .string()
      .trim()
      .max(DESCRIPCION_MAX, e.descripcionLarga)
      .transform((v) => (v === '' ? null : v)),
    // Empieza sin elegir (null) al crear; al enviar es obligatoria.
    categoria: z
      .enum(AREAS, e.categoria)
      .nullable()
      .transform((v, ctx) => {
        if (v !== null) return v;
        ctx.addIssue({ code: 'custom', message: e.categoria });
        return z.NEVER;
      }),
    frecuencia: z.enum(FRECUENCIAS),
    dias: z.array(z.int().min(1).max(7)),
    duracion: z
      .string()
      .trim()
      .regex(/^\d{1,3}$/, e.duracion)
      .transform(Number)
      .pipe(z.number().min(1, e.duracion).max(DURACION_MAX, e.duracion)),
    // Nula solo en hábitos del plan con aviso flexible que no se cambiaron.
    hora: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, e.hora)
      .nullable(),
    avisarme: z.boolean(),
  })
  .refine((v) => v.frecuencia === 'todos' || v.dias.length > 0, {
    message: e.dias,
    path: ['dias'],
  })
  .transform(({ frecuencia, dias, ...resto }) => ({
    ...resto,
    dias_semana: frecuencia === 'todos' ? TODOS_LOS_DIAS : [...new Set(dias)].sort((a, b) => a - b),
  }));

export type HabitoFormInput = z.input<typeof habitoFormSchema>;
export type HabitoFormValues = z.output<typeof habitoFormSchema>;
