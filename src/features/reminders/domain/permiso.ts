// Qué hacer con el permiso de avisos (SDD 7.1). Función pura: el estado real lo lee `avisos.ts`.
// Los recordatorios necesitan el permiso, así que se pide cada vez que la persona elige una hora
// sin tenerlo: no es insistir, es el momento en que lo necesita.

export type EstadoPermiso = {
  concedido: boolean;
  /** Android todavía deja mostrar su pregunta (si se negó dos veces, ya no). */
  puedePreguntar: boolean;
};

/** listo: ya está dado · preguntar: se puede pedir · ajustes: solo se activa en Ajustes. */
export type SiguientePaso = 'listo' | 'preguntar' | 'ajustes';

export function siguientePaso(estado: EstadoPermiso): SiguientePaso {
  if (estado.concedido) return 'listo';
  return estado.puedePreguntar ? 'preguntar' : 'ajustes';
}
