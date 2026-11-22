import {
  estaVisible,
  habitosDelDia,
  type Habito,
  type Horario,
  type HabitoDelDia,
  type Ocurrencia,
  type Registro,
} from '@/features/habits/domain/habitos-del-dia';
import { fechaLocal, sumarDias } from '@/lib/dates';
import type { Area } from '@/schemas/onboarding';

import type { Periodo, Rango } from './periodos';
import { rachaDeHabito, type Racha } from './rachas';

// Cumplimiento de Progreso (SDD 8). Funciones puras sobre las filas de SQLite.
//
// - Una ocurrencia es un día del patrón vigente o un día al que llegó por reprogramación; el día
//   original de una movida no cuenta, y una descartada cuenta como no hecha.
// - Hoy solo suma lo que ya se hizo: lo pendiente de hoy no baja el resultado ni rompe la racha.
// - Archivados: cuentan hasta el día anterior a archivarlos. En pausa: hasta su último registro
//   (la app no guarda desde cuándo están en pausa; decisión del usuario).
// - Los topes de XP y monedas no importan: un registro hecho cuenta igual.

export type DatosEstadisticas = {
  /** Todos los hábitos, también los archivados, en orden de creación. */
  habitos: readonly Habito[];
  horarios: readonly Horario[];
  ocurrencias: readonly Ocurrencia[];
  /** Registros hechos (no deshechos). */
  registros: readonly Registro[];
  /** category_id → área. */
  categorias: ReadonlyMap<string, Area>;
};

/**
 * Estado de un hábito en un día que le toca: hecho, sin marcar (día pasado), pendiente (hoy) o
 * «te toca» (día futuro). Un día que no le toca no tiene estado.
 */
export type EstadoDia = 'hecho' | 'sin_marcar' | 'pendiente' | 'toca';

export type Celda = { estado: EstadoDia; reprogramado: boolean };

/** habitId → fecha → celda. */
export type Estados = ReadonlyMap<string, ReadonlyMap<string, Celda>>;

export type OcurrenciaEstadistica = { fecha: string; habitId: string; hecho: boolean };

export type Conteo = { hechos: number; total: number };

export type FilaHabito = {
  habito: Habito;
  area: Area;
  conteo: Conteo;
  racha: Racha;
  estado: 'activo' | 'pausa' | 'archivado';
};

export type Seccion = { area: Area; filas: FilaHabito[] };

export type Resumen = {
  total: Conteo;
  divisiones: Conteo[];
  /** Los hábitos agrupados por área, en el orden de las áreas (solo la filtrada, si hay filtro). */
  secciones: Seccion[];
  /** Las áreas con hábitos en el periodo, sin importar el filtro: las opciones del filtro. */
  areas: Area[];
  /** El área filtrada, o `null` con «Todos» o si el área pedida no tiene hábitos en el periodo. */
  filtro: Area | null;
};

export type HabitoDeUnDia = {
  habito: Habito;
  area: Area;
  horario: HabitoDelDia['horario'];
  estado: EstadoDia;
  reprogramado: boolean;
};

/** Regla de archivados y pausados para `habitosDelDia`. */
export function cuentaEn(ultimoRegistro: ReadonlyMap<string, string>) {
  return (habito: Habito, fecha: string): boolean => {
    if (habito.archivado_en !== null && fecha >= fechaLocal(new Date(habito.archivado_en))) {
      return false;
    }
    if (!habito.activo) {
      const ultimo = ultimoRegistro.get(habito.id);
      return ultimo !== undefined && fecha <= ultimo;
    }
    return true;
  };
}

/** Primer día con horario de un hábito con categoría, o null si no hay ninguno. */
export function primerDia(datos: DatosEstadisticas): string | null {
  const conCategoria = new Set(
    datos.habitos.filter((h) => datos.categorias.has(h.category_id)).map((h) => h.id),
  );
  const fechas = datos.horarios
    .filter((h) => conCategoria.has(h.habit_id))
    .map((h) => h.vigente_desde)
    // Fechas "YYYY-MM-DD": el orden alfabético es el cronológico (con comparación explícita).
    .sort((a, b) => a.localeCompare(b));
  return fechas[0] ?? null;
}

function agrupar<T>(filas: readonly T[], claves: (fila: T) => (string | null)[]) {
  const mapa = new Map<string, T[]>();
  for (const fila of filas) {
    for (const clave of new Set(claves(fila))) {
      if (clave === null) continue;
      const lista = mapa.get(clave);
      if (lista) lista.push(fila);
      else mapa.set(clave, [fila]);
    }
  }
  return mapa;
}

function estadoDelDia(hecho: boolean, fecha: string, hoy: string): EstadoDia {
  if (hecho) return 'hecho';
  if (fecha < hoy) return 'sin_marcar';
  return fecha === hoy ? 'pendiente' : 'toca';
}

/**
 * Recorre los días de `desde` a `hasta` y entrega lo que toca cada día, con la regla de archivados
 * y pausados. Los índices por fecha hacen que `habitosDelDia` reciba solo las filas de ese día.
 */
function recorrer(
  datos: DatosEstadisticas,
  desde: string,
  hasta: string,
  visitar: (fecha: string, items: HabitoDelDia[]) => void,
) {
  const habitos = datos.habitos.filter((h) => datos.categorias.has(h.category_id));
  const ultimoRegistro = new Map<string, string>();
  for (const r of datos.registros) {
    if (r.eliminado_en !== null) continue;
    const previo = ultimoRegistro.get(r.habit_id);
    if (previo === undefined || r.fecha > previo) ultimoRegistro.set(r.habit_id, r.fecha);
  }
  const incluir = cuentaEn(ultimoRegistro);
  const registrosPorDia = agrupar(datos.registros, (r) => [r.fecha]);
  // Solo las movidas: una descartada se queda en su día y cuenta como no hecha (rompe la racha).
  const movidas = datos.ocurrencias.filter((o) => o.estado === 'movida');
  const ocurrenciasPorDia = agrupar(movidas, (o) => [o.fecha_original, o.fecha_nueva]);

  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    visitar(
      fecha,
      habitosDelDia(
        fecha,
        habitos,
        datos.horarios,
        ocurrenciasPorDia.get(fecha) ?? [],
        registrosPorDia.get(fecha) ?? [],
        incluir,
      ),
    );
  }
}

/** El estado de cada hábito en cada día del rango que le toca (pasado, hoy o futuro). */
export function estadosDelRango(
  datos: DatosEstadisticas,
  desde: string,
  hasta: string,
  hoy: string,
): Estados {
  const estados = new Map<string, Map<string, Celda>>();
  const inicio = primerDia(datos);
  if (inicio === null) return estados;
  recorrer(datos, desde > inicio ? desde : inicio, hasta, (fecha, items) => {
    for (const item of items) {
      let delHabito = estados.get(item.habito.id);
      if (!delHabito) {
        delHabito = new Map();
        estados.set(item.habito.id, delHabito);
      }
      delHabito.set(fecha, {
        estado: estadoDelDia(item.hecho, fecha, hoy),
        reprogramado: item.reprogramado,
      });
    }
  });
  return estados;
}

/** Lo que toca en un día, por hora (pestaña Diario). */
export function habitosDeUnDia(
  datos: DatosEstadisticas,
  fecha: string,
  hoy: string,
): HabitoDeUnDia[] {
  const resultado: HabitoDeUnDia[] = [];
  recorrer(datos, fecha, fecha, (_, items) => {
    for (const item of items) {
      const area = datos.categorias.get(item.habito.category_id);
      if (area === undefined) continue;
      resultado.push({
        habito: item.habito,
        area,
        horario: item.horario,
        estado: estadoDelDia(item.hecho, fecha, hoy),
        reprogramado: item.reprogramado,
      });
    }
  });
  return resultado;
}

/**
 * Todas las ocurrencias desde el primer horario hasta hoy, en orden de fecha, sin lo pendiente de
 * hoy. De aquí salen los conteos y las rachas.
 */
export function historial(datos: DatosEstadisticas, hoy: string): OcurrenciaEstadistica[] {
  const desde = primerDia(datos);
  if (desde === null || desde > hoy) return [];
  const resultado: OcurrenciaEstadistica[] = [];
  recorrer(datos, desde, hoy, (fecha, items) => {
    for (const item of items) {
      if (fecha === hoy && !item.hecho) continue;
      resultado.push({ fecha, habitId: item.habito.id, hecho: item.hecho });
    }
  });
  return resultado;
}

export function contar(ocurrencias: readonly OcurrenciaEstadistica[]): Conteo {
  return {
    hechos: ocurrencias.filter((o) => o.hecho).length,
    total: ocurrencias.length,
  };
}

/** Racha de cada hábito sobre todo su historial. */
export function rachasPorHabito(
  ocurrencias: readonly OcurrenciaEstadistica[],
): ReadonlyMap<string, Racha> {
  return new Map(
    [...agrupar(ocurrencias, (o) => [o.habitId])].map(([id, suyas]) => [id, rachaDeHabito(suyas)]),
  );
}

const dentro = (fecha: string, rango: Rango) => fecha >= rango.desde && fecha <= rango.hasta;

function estadoDe(habito: Habito): FilaHabito['estado'] {
  if (habito.archivado_en !== null) return 'archivado';
  return habito.activo ? 'activo' : 'pausa';
}

/**
 * Lo que muestra Progreso para un periodo: el conteo total y por división, y los hábitos agrupados
 * por área (los visibles y los que tuvieron días en el periodo), cada uno con su conteo y su racha.
 * Con un área en `filtro` (decisión del usuario), el conteo y las secciones son solo de esa área;
 * si el área no tiene hábitos en el periodo, se ignora y se muestra todo.
 */
export function resumenDelPeriodo(
  datos: DatosEstadisticas,
  ocurrencias: readonly OcurrenciaEstadistica[],
  actual: Periodo,
  ordenAreas: readonly Area[],
  filtro: Area | null = null,
): Resumen {
  const porHabito = agrupar(ocurrencias, (o) => [o.habitId]);

  const filas = datos.habitos.flatMap((habito): FilaHabito[] => {
    const area = datos.categorias.get(habito.category_id);
    if (area === undefined) return [];
    const suyas = porHabito.get(habito.id) ?? [];
    const conteo = contar(suyas.filter((o) => dentro(o.fecha, actual)));
    if (!estaVisible(habito) && conteo.total === 0) return [];
    return [{ habito, area, conteo, racha: rachaDeHabito(suyas), estado: estadoDe(habito) }];
  });

  const todas = ordenAreas
    .map((area) => ({ area, filas: filas.filter((f) => f.area === area) }))
    .filter((s) => s.filas.length > 0);
  const areas = todas.map((s) => s.area);
  const vigente = filtro !== null && areas.includes(filtro) ? filtro : null;

  const areaDe = new Map(datos.habitos.map((h) => [h.id, datos.categorias.get(h.category_id)]));
  const delPeriodo = ocurrencias.filter(
    (o) => dentro(o.fecha, actual) && (vigente === null || areaDe.get(o.habitId) === vigente),
  );

  return {
    total: contar(delPeriodo),
    divisiones: actual.divisiones.map((rango) =>
      contar(delPeriodo.filter((o) => dentro(o.fecha, rango))),
    ),
    secciones: vigente === null ? todas : todas.filter((s) => s.area === vigente),
    areas,
    filtro: vigente,
  };
}
