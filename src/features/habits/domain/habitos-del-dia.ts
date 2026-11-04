import { diaIso } from '@/lib/dates';

// Qué hábitos tocan en una fecha (pantalla Hoy, SDD 9.4). Función pura: recibe las filas que ya
// están en SQLite y decide, sin consultar nada más.

export type Habito = {
  id: string;
  category_id: string;
  plan_id: string | null;
  titulo: string;
  descripcion: string | null;
  duracion_min: number;
  activo: boolean;
  archivado_en: string | null;
};

export type Horario = {
  id: string;
  habit_id: string;
  dias_semana: number[];
  /** "HH:MM" o "HH:MM:SS" (Postgres guarda `time`); nula si el aviso es flexible. */
  hora: string | null;
  flexible: boolean;
  notificar: boolean;
  vigente_desde: string;
  vigente_hasta: string | null;
};

export type Ocurrencia = {
  habit_id: string;
  fecha_original: string;
  fecha_nueva: string | null;
  estado: 'movida' | 'descartada';
};

export type Registro = { habit_id: string; fecha: string; eliminado_en: string | null };

export type HabitoDelDia = {
  habito: Habito;
  horario: Horario;
  hecho: boolean;
  /** Llegó a esta fecha por una reprogramación (SDD 6.2). */
  reprogramado: boolean;
};

/** Un hábito se muestra si está activo (no pausado) y no se archivó. */
export function estaVisible(h: Habito): boolean {
  return h.activo && h.archivado_en === null;
}

/** Horario que vale en la fecha: los anteriores quedaron cerrados al editar (SDD 4). */
export function horarioVigente(horarios: readonly Horario[], fecha: string): Horario | undefined {
  return horarios
    .filter(
      (h) => h.vigente_desde <= fecha && (h.vigente_hasta === null || h.vigente_hasta >= fecha),
    )
    .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))[0];
}

/**
 * Horario para mostrar y editar un hábito: el vigente en la fecha; si todavía no empieza, el
 * próximo; si ya terminó, el último.
 */
export function horarioDeReferencia(
  horarios: readonly Horario[],
  fecha: string,
): Horario | undefined {
  const vigente = horarioVigente(horarios, fecha);
  if (vigente) return vigente;
  const ordenados = [...horarios].sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde));
  return ordenados.find((h) => h.vigente_desde > fecha) ?? ordenados.at(-1);
}

export function habitosDelDia(
  fecha: string,
  habitos: readonly Habito[],
  horarios: readonly Horario[],
  ocurrencias: readonly Ocurrencia[],
  registros: readonly Registro[],
): HabitoDelDia[] {
  const dia = diaIso(fecha);
  const hechos = new Set(
    registros.filter((r) => r.fecha === fecha && r.eliminado_en === null).map((r) => r.habit_id),
  );
  // Ocurrencias que salen de esta fecha (movidas a otro día o descartadas) y las que llegan.
  const salen = new Set(
    ocurrencias.filter((o) => o.fecha_original === fecha).map((o) => o.habit_id),
  );
  const llegan = new Set(
    ocurrencias
      .filter((o) => o.estado === 'movida' && o.fecha_nueva === fecha)
      .map((o) => o.habit_id),
  );

  const resultado: HabitoDelDia[] = [];
  for (const habito of habitos) {
    if (!estaVisible(habito)) continue;
    const horario = horarioVigente(
      horarios.filter((h) => h.habit_id === habito.id),
      fecha,
    );
    if (horario === undefined) continue;

    const porPatron = horario.dias_semana.includes(dia) && !salen.has(habito.id);
    const reprogramado = llegan.has(habito.id);
    if (!porPatron && !reprogramado) continue;

    resultado.push({ habito, horario, hecho: hechos.has(habito.id), reprogramado });
  }

  // Por hora; los flexibles (sin hora) al final.
  return resultado.sort((a, b) => (a.horario.hora ?? '99').localeCompare(b.horario.hora ?? '99'));
}
