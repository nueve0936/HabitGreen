import { z } from 'zod';

import { es } from '@/i18n/es';

import { AREAS } from './onboarding';

// Asistente de crear y editar hábito (SDD 6.5, mockups «Crear hábito #1–#3»). La frecuencia son
// días de la semana: es lo que guarda `habit_schedules.dias_semana`. Las fechas de inicio y fin son
// `vigente_desde` y `vigente_hasta` del horario. Sin recordatorio = sin hora y `notificar` falso.

const e = es.habitForm.errores;

export const NOMBRE_MIN = 3;
export const NOMBRE_MAX = 60;
export const DESCRIPCION_MAX = 140;
export const DURACION_MAX = 120;
export const DURACIONES = [5, 10, 15, 20, 30, 45, 60] as const;
export const TODOS_LOS_DIAS = [1, 2, 3, 4, 5, 6, 7];

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

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
    dias: z.array(z.int().min(1).max(7)).min(1, e.dias),
    duracion: z.int(e.duracion).min(1, e.duracion).max(DURACION_MAX, e.duracion),
    hora: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, e.hora)
      .nullable(),
    notificar: z.boolean(),
    /** El hábito del plan tenía aviso flexible (ventana): puede seguir avisando sin hora fija. */
    flexible: z.boolean(),
    fecha_inicio: fecha,
    fecha_fin: fecha.nullable(),
  })
  .refine((v) => !v.notificar || v.hora !== null || v.flexible, {
    message: e.hora,
    path: ['hora'],
  })
  .refine((v) => v.fecha_fin === null || v.fecha_fin >= v.fecha_inicio, {
    message: e.fechaFin,
    path: ['fecha_fin'],
  })
  .transform(({ dias, flexible: _flexible, ...resto }) => ({
    ...resto,
    dias_semana: [...new Set(dias)].sort((a, b) => a - b),
  }));

export type HabitoFormInput = z.input<typeof habitoFormSchema>;
export type HabitoFormValues = z.output<typeof habitoFormSchema>;
