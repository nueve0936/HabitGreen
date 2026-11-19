import { diasDelMes } from '@/features/habits/domain/fechas';
import { diaIso, sumarDias } from '@/lib/dates';

// Periodos de Progreso (SDD 8): semana ISO (lunes a domingo), mes y año naturales. Cada periodo se
// parte en divisiones para la gráfica: días en la semana, semanas en el mes y meses en el año.
// Fechas como texto "YYYY-MM-DD".

export type Vista = 'semana' | 'mes' | 'anio';

export type Rango = { desde: string; hasta: string };

export type Periodo = Rango & {
  vista: Vista;
  /** 0 es el periodo actual; -1 el anterior, y así. */
  desplazamiento: number;
  divisiones: Rango[];
};

const dos = (n: number) => String(n).padStart(2, '0');

function lunesDe(fecha: string): string {
  return sumarDias(fecha, 1 - diaIso(fecha));
}

/** Mes desplazado `n` meses desde el año y mes dados (mes de 1 a 12). */
function mesDesplazado(anio: number, mes: number, n: number): { anio: number; mes: number } {
  const total = anio * 12 + (mes - 1) + n;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

function rangoDeMes(anio: number, mes: number): Rango {
  return {
    desde: `${anio}-${dos(mes)}-01`,
    hasta: `${anio}-${dos(mes)}-${dos(diasDelMes(anio, mes))}`,
  };
}

/** Semanas (de lunes a domingo) recortadas a los límites del mes. */
function semanasDelMes({ desde, hasta }: Rango): Rango[] {
  const semanas: Rango[] = [];
  let inicio = desde;
  while (inicio <= hasta) {
    const domingo = sumarDias(inicio, 7 - diaIso(inicio));
    const fin = domingo < hasta ? domingo : hasta;
    semanas.push({ desde: inicio, hasta: fin });
    inicio = sumarDias(fin, 1);
  }
  return semanas;
}

export function periodo(vista: Vista, hoy: string, desplazamiento = 0): Periodo {
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));

  if (vista === 'semana') {
    const desde = sumarDias(lunesDe(hoy), desplazamiento * 7);
    const divisiones = Array.from({ length: 7 }, (_, i) => {
      const dia = sumarDias(desde, i);
      return { desde: dia, hasta: dia };
    });
    return { vista, desplazamiento, desde, hasta: sumarDias(desde, 6), divisiones };
  }

  if (vista === 'mes') {
    const destino = mesDesplazado(anio, mes, desplazamiento);
    const rango = rangoDeMes(destino.anio, destino.mes);
    return { vista, desplazamiento, ...rango, divisiones: semanasDelMes(rango) };
  }

  const elegido = anio + desplazamiento;
  return {
    vista,
    desplazamiento,
    desde: `${elegido}-01-01`,
    hasta: `${elegido}-12-31`,
    divisiones: Array.from({ length: 12 }, (_, i) => rangoDeMes(elegido, i + 1)),
  };
}

/** Hay periodo anterior si este empieza después del primer día con horario. */
export function hayAnterior(actual: Periodo, primerDia: string | null): boolean {
  return primerDia !== null && actual.desde > primerDia;
}

/** No se avanza más allá del periodo actual. */
export function haySiguiente(actual: Periodo): boolean {
  return actual.desplazamiento < 0;
}

/** Días que alcanza la tira de Diario hacia adelante y, como mucho, hacia atrás. */
export const TIRA_ADELANTE = 7;
export const TIRA_ATRAS_MAX = 365;

/**
 * Semanas de la tira de Diario, de lunes a domingo: desde la semana del primer día con horario
 * (como mucho un año atrás, lo que guarda el teléfono) hasta la semana que contiene hoy + 7. Se
 * recorren deslizando de 7 en 7.
 */
export function semanasDeTira(primerDia: string | null, hoy: string): string[][] {
  const limite = sumarDias(hoy, -TIRA_ATRAS_MAX);
  let desde = primerDia === null || primerDia > hoy ? hoy : primerDia;
  if (desde < limite) desde = limite;
  const ultimoLunes = lunesDe(sumarDias(hoy, TIRA_ADELANTE));
  const semanas: string[][] = [];
  for (let lunes = lunesDe(desde); lunes <= ultimoLunes; lunes = sumarDias(lunes, 7)) {
    semanas.push(Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)));
  }
  return semanas;
}

/** El día de `semana` que cae en el mismo día de la semana que `fecha` (miércoles → miércoles). */
export function mismoDiaEn(semana: readonly string[], fecha: string): string {
  return semana[diaIso(fecha) - 1];
}

/**
 * Cuadrícula de lunes a domingo de un rango: filas de 7, con null en los huecos antes del primer
 * día y después del último (mini calendario del mes).
 */
export function semanasDeCalendario({ desde, hasta }: Rango): (string | null)[][] {
  const filas: (string | null)[][] = [];
  let fila: (string | null)[] = Array.from({ length: diaIso(desde) - 1 }, () => null);
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) {
    fila.push(d);
    if (fila.length === 7) {
      filas.push(fila);
      fila = [];
    }
  }
  if (fila.length > 0)
    filas.push([...fila, ...Array.from({ length: 7 - fila.length }, () => null)]);
  return filas;
}
