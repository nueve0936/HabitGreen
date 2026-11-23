// «¿Qué pasó?» en la tarjeta de reprogramación (ajustes, decisiones del usuario del 22 nov): es
// opcional, se elige una causa y la app sugiere un solo ajuste con lo que ya existe. La respuesta
// no se guarda: solo sirve para la sugerencia del momento.

export const CAUSAS = ['tiempo', 'energia', 'recursos', 'olvido'] as const;
export type Causa = (typeof CAUSAS)[number];

export type ContextoQuePaso = {
  /** Hábito del plan que todavía tiene un paso más ligero. */
  masLigero: boolean;
  /** Tiene minutos (los hábitos sin duración no se pueden acortar). */
  conDuracion: boolean;
  /** Su horario de hoy tiene recordatorio. */
  recordatorio: boolean;
  segundoAviso: boolean;
  /** El estilo de avisos tiene segundo aviso (con «Resumen nocturno» no existe). */
  segundoAvisoDisponible: boolean;
};

export type Sugerencia =
  | { tipo: 'mas_ligero' }
  | { tipo: 'editar_duracion' }
  | { tipo: 'otro_dia' }
  | { tipo: 'recordatorio' }
  | { tipo: 'segundo_aviso' }
  | { tipo: 'animo' };

/** El ajuste que se sugiere para una causa, según lo que el hábito ya tiene. */
export function sugerir(causa: Causa, c: ContextoQuePaso): Sugerencia {
  switch (causa) {
    case 'tiempo':
    case 'energia':
      if (c.masLigero) return { tipo: 'mas_ligero' };
      // Sin un paso más ligero ni minutos que bajar, queda moverlo a un día con más espacio.
      return c.conDuracion ? { tipo: 'editar_duracion' } : { tipo: 'otro_dia' };
    case 'recursos':
      return { tipo: 'otro_dia' };
    case 'olvido':
      if (!c.recordatorio) return { tipo: 'recordatorio' };
      if (c.segundoAvisoDisponible && !c.segundoAviso) return { tipo: 'segundo_aviso' };
      return { tipo: 'animo' };
  }
}
