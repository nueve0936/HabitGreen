import {
  habitosDelDia,
  horarioVigente,
  type Habito,
  type Horario,
  type Ocurrencia,
  type Registro,
} from '@/features/habits/domain/habitos-del-dia';
import { diaIso, sumarDias } from '@/lib/dates';

// Reprogramación de hábitos no hechos (SDD 6.2). Funciones puras: reciben las filas de SQLite y
// deciden qué ofrecer mover y a qué día, sin consultar nada más.
//
// - Se revisan los últimos 7 días (sin contar hoy) y se puede mover de hoy a 7 días adelante.
// - Por hábito se ofrece solo el día más reciente sin hacer; los anteriores se guardan como
//   «descartada» al resolverlo, para no traer una pila de pendientes.
// - Un hábito que llegó movido y tampoco se hizo no se vuelve a ofrecer.
// - Un hábito que ocupa los 7 días no tiene día libre: se omite en silencio.

export const DIAS_ATRAS = 7;
export const DIAS_ADELANTE = 7;

export type DatosReprogramar = {
  habitos: readonly Habito[];
  horarios: readonly Horario[];
  ocurrencias: readonly Ocurrencia[];
  registros: readonly Registro[];
  /** `presupuesto_min`: un día no puede pasar de estos minutos con el hábito movido. */
  presupuesto: number;
};

export type Pendiente = {
  habito: Habito;
  /** El día más reciente sin hacer: es el que se ofrece mover. */
  fechaOriginal: string;
  /** Días anteriores sin hacer del mismo hábito, del más antiguo al más reciente. */
  anteriores: string[];
};

export type Propuesta = Pendiente & {
  /** Primer día libre, o null si no hay ninguno («La dejamos para la próxima»). */
  diaPropuesto: string | null;
  /** Todos los días libres, para «Elegir otro día». */
  diasLibres: string[];
};

type Llegada = { habitId: string; fecha: string; duracion: number };

/** Hábitos de los últimos 7 días que tocaban, no se hicieron y se pueden mover. */
export function pendientesDeReprogramar(datos: DatosReprogramar, hoy: string): Pendiente[] {
  const porHabito = new Map<string, Pendiente>();
  // Del más antiguo al más reciente: el último que se encuentra es el que se ofrece.
  for (let atras = DIAS_ATRAS; atras >= 1; atras--) {
    const fecha = sumarDias(hoy, -atras);
    const items = habitosDelDia(
      fecha,
      datos.habitos,
      datos.horarios,
      datos.ocurrencias,
      datos.registros,
    );
    for (const item of items) {
      // Ya movido a este día: no se vuelve a mover. Con los 7 días no hay día libre.
      if (item.hecho || item.reprogramado || item.horario.dias_semana.length >= 7) continue;
      const previo = porHabito.get(item.habito.id);
      porHabito.set(item.habito.id, {
        habito: item.habito,
        fechaOriginal: fecha,
        anteriores: previo ? [...previo.anteriores, previo.fechaOriginal] : [],
      });
    }
  }
  return [...porHabito.values()].sort((a, b) => a.fechaOriginal.localeCompare(b.fechaOriginal));
}

/** Minutos que ya tiene un día: sus hábitos (con los movidos que llegan) y las propuestas previas. */
function minutosDelDia(datos: DatosReprogramar, fecha: string, llegadas: readonly Llegada[]) {
  const programados = habitosDelDia(fecha, datos.habitos, datos.horarios, datos.ocurrencias, []);
  return (
    programados.reduce((suma, item) => suma + item.habito.duracion_min, 0) +
    llegadas.filter((l) => l.fecha === fecha).reduce((suma, l) => suma + l.duracion, 0)
  );
}

/**
 * Días de hoy a 7 días adelante donde cabe el hábito: tiene horario vigente, el día no es de su
 * patrón, no llega ya otra ocurrencia suya y no pasa del presupuesto.
 */
export function diasLibres(
  habito: Habito,
  datos: DatosReprogramar,
  hoy: string,
  llegadas: readonly Llegada[] = [],
): string[] {
  const propios = datos.horarios.filter((h) => h.habit_id === habito.id);
  const yaLlega = new Set([
    ...datos.ocurrencias
      .filter((o) => o.habit_id === habito.id && o.estado === 'movida' && o.fecha_nueva !== null)
      .map((o) => o.fecha_nueva as string),
    ...llegadas.filter((l) => l.habitId === habito.id).map((l) => l.fecha),
  ]);

  const libres: string[] = [];
  for (let adelante = 0; adelante <= DIAS_ADELANTE; adelante++) {
    const fecha = sumarDias(hoy, adelante);
    const horario = horarioVigente(propios, fecha);
    if (horario === undefined || horario.dias_semana.includes(diaIso(fecha))) continue;
    if (yaLlega.has(fecha)) continue;
    if (minutosDelDia(datos, fecha, llegadas) + habito.duracion_min > datos.presupuesto) continue;
    libres.push(fecha);
  }
  return libres;
}

/**
 * Propuestas en orden, del día más antiguo al más reciente. Cada una cuenta las anteriores como si
 * ya se hubieran movido, para que no caigan juntas en un día que se pasaría del presupuesto.
 */
export function propuestasDeReprogramacion(datos: DatosReprogramar, hoy: string): Propuesta[] {
  const llegadas: Llegada[] = [];
  return pendientesDeReprogramar(datos, hoy).map((pendiente) => {
    const libres = diasLibres(pendiente.habito, datos, hoy, llegadas);
    const diaPropuesto = libres[0] ?? null;
    if (diaPropuesto !== null) {
      llegadas.push({
        habitId: pendiente.habito.id,
        fecha: diaPropuesto,
        duracion: pendiente.habito.duracion_min,
      });
    }
    return { ...pendiente, diaPropuesto, diasLibres: libres };
  });
}
