import { z } from 'zod';

import { es, formatear } from '@/i18n/es';

const v = es.auth.validacion;

export const MIN_PASSWORD_LENGTH = 8;
/** Largo máximo del correo (decisión del usuario). Cámbialo aquí: lo usan el esquema y los campos. */
export const EMAIL_MAX = 50;
/**
 * Largo máximo de la contraseña: Supabase Auth (bcrypt) no acepta más de 72. Sin este tope, una
 * contraseña más larga fallaba en el servidor con un error poco claro.
 */
export const PASSWORD_MAX = 72;

const email = z
  .string()
  .trim()
  .min(1, v.correoRequerido)
  .max(EMAIL_MAX, formatear(v.correoLargo, { n: EMAIL_MAX }))
  .pipe(z.email(v.correoInvalido))
  .transform((value) => value.toLowerCase());

const newPassword = z
  .string()
  .min(1, v.contrasenaRequerida)
  .min(MIN_PASSWORD_LENGTH, v.contrasenaCorta)
  .max(PASSWORD_MAX, formatear(v.contrasenaLarga, { n: PASSWORD_MAX }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, v.contrasenaRequerida),
});

export const registerSchema = z
  .object({
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, v.contrasenaRequerida),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.contrasenasDistintas,
    path: ['confirmPassword'],
  });

export const recoverSchema = z.object({ email });

// Supabase envía códigos de 6 a 10 dígitos (en el proyecto remoto son 8). Se quitan los espacios
// por si el usuario copia el código con ellos.
export const recoveryCodeSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(
      z
        .string()
        .min(1, v.codigoRequerido)
        .regex(/^\d{6,10}$/, v.codigoInvalido),
    ),
});

export const newPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, v.contrasenaRequerida),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.contrasenasDistintas,
    path: ['confirmPassword'],
  });

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;
export type RecoverInput = z.input<typeof recoverSchema>;
export type RecoverValues = z.output<typeof recoverSchema>;
export type RecoveryCodeInput = z.input<typeof recoveryCodeSchema>;
export type RecoveryCodeValues = z.output<typeof recoveryCodeSchema>;
export type NewPasswordInput = z.input<typeof newPasswordSchema>;
export type NewPasswordValues = z.output<typeof newPasswordSchema>;
