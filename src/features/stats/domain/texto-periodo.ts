import { es, formatear } from '@/i18n/es';
import { diaIso } from '@/lib/dates';

import type { Conteo } from './cumplimiento';
import type { Periodo, Rango } from './periodos';

// Cómo se nombran los periodos y sus divisiones en Progreso: «10–16 nov», «Noviembre 2026» o
// «2026», y las etiquetas de la gráfica con su versión larga para TalkBack.

type Textos = typeof es.estadisticas;

const dia = (fecha: string) => Number(fecha.slice(8, 10));
const mes = (fecha: string) => Number(fecha.slice(5, 7)) - 1;
const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

function rangoCorto({ desde, hasta }: Rango, t: Textos): string {
  // La primera o la última semana del mes puede tener un solo día: «1 nov», no «1–1 nov».
  if (desde === hasta) {
    return formatear(t.rangoUnDia, { d: dia(desde), mes: t.mesesAbrev[mes(desde)] });
  }
  if (mes(desde) === mes(hasta)) {
    return formatear(t.rangoSemana, {
      d1: dia(desde),
      d2: dia(hasta),
      mes: t.mesesAbrev[mes(hasta)],
    });
  }
  return formatear(t.rangoSemanaDosMeses, {
    d1: dia(desde),
    mes1: t.mesesAbrev[mes(desde)],
    d2: dia(hasta),
    mes2: t.mesesAbrev[mes(hasta)],
  });
}

/** «16–22 nov» o «28 dic – 3 ene»: el rango de una semana, como el de la tira de Diario. */
export function etiquetaRango(rango: Rango, t: Textos = es.estadisticas): string {
  return rangoCorto(rango, t);
}

export function etiquetaPeriodo(actual: Periodo, t: Textos = es.estadisticas): string {
  if (actual.vista === 'semana') return rangoCorto(actual, t);
  if (actual.vista === 'mes') {
    return formatear(t.rangoMes, {
      mes: mayuscula(t.meses[mes(actual.desde)]),
      anio: actual.desde.slice(0, 4),
    });
  }
  return actual.desde.slice(0, 4);
}

export type EtiquetaDivision = {
  /** En la gráfica: «L», «3–9», «E». */
  corta: string;
  /** Para TalkBack: «Lunes 16», «Semana del 3–9 nov», «Enero». */
  nombre: string;
  /** Contiene hoy: su etiqueta va en negritas («Hoy» en la semana). */
  actual: boolean;
  /** Empieza después de hoy: no tiene barra. */
  futura: boolean;
};

export function etiquetasDivisiones(
  actual: Periodo,
  hoy: string,
  t: Textos = es.estadisticas,
): EtiquetaDivision[] {
  return actual.divisiones.map((rango, i) => {
    const contieneHoy = rango.desde <= hoy && hoy <= rango.hasta;
    const base = { actual: contieneHoy, futura: rango.desde > hoy };
    if (actual.vista === 'semana') {
      return {
        ...base,
        corta: contieneHoy ? t.hoy : t.diasCortos[i],
        nombre: `${t.dias[i]} ${dia(rango.desde)}`,
      };
    }
    if (actual.vista === 'mes') {
      const corta =
        rango.desde === rango.hasta
          ? String(dia(rango.desde))
          : formatear(t.rangoDias, { d1: dia(rango.desde), d2: dia(rango.hasta) });
      return { ...base, corta, nombre: formatear(t.semanaDel, { rango: rangoCorto(rango, t) }) };
    }
    return { ...base, corta: t.mesesCortos[i], nombre: mayuscula(t.meses[i]) };
  });
}

/** «Cumpliste 12 de 15 esta semana», o un texto amable si todavía no hay nada que contar. */
export function fraseResumen(actual: Periodo, total: Conteo, t: Textos = es.estadisticas): string {
  const tiempo = actual.desplazamiento === 0 ? 'actual' : 'pasado';
  if (total.total === 0) return t.sinNada[tiempo][actual.vista];
  return formatear(t.cumpliste[tiempo][actual.vista], { n: total.hechos, total: total.total });
}

/** Detalle de la gráfica para TalkBack: «Lunes 16: 2 de 2. Martes 17: sin hábitos. …». */
export function detalleGrafica(
  etiquetas: readonly EtiquetaDivision[],
  conteos: readonly Conteo[],
  t: Textos = es.estadisticas,
): string {
  return etiquetas
    .map((e, i) => {
      const c = conteos[i] ?? { hechos: 0, total: 0 };
      if (e.futura) return formatear(t.detalleFuturo, { nombre: e.nombre });
      if (c.total === 0) return formatear(t.detalleSinDias, { nombre: e.nombre });
      return formatear(t.detalle, { nombre: e.nombre, n: c.hechos, total: c.total });
    })
    .join('. ');
}

/** «lunes 16». */
function nombreDia(fecha: string, t: Textos): string {
  return `${t.dias[diaIso(fecha) - 1].toLowerCase()} ${dia(fecha)}`;
}

export type FichaDia = {
  /** «Hoy» o el día corto («Lun»). */
  corta: string;
  numero: number;
  /** Para TalkBack: «Hoy, miércoles 18» o «Lunes 16». */
  nombre: string;
  esHoy: boolean;
};

/** Una ficha de la tira de Diario. */
export function fichaDia(fecha: string, hoy: string, t: Textos = es.estadisticas): FichaDia {
  const esHoy = fecha === hoy;
  const largo = nombreDia(fecha, t);
  return {
    corta: esHoy ? t.hoy : t.diasAbrev[diaIso(fecha) - 1],
    numero: dia(fecha),
    nombre: esHoy ? formatear(t.fichaHoy, { dia: largo }) : mayuscula(largo),
    esHoy,
  };
}

/**
 * Frase de Diario: «Llevas 1 de 3 hoy», «Hiciste 2 de 3 el lunes 16» o «El jueves 19 te tocan 3
 * hábitos». `total` cuenta todo lo que toca ese día (hoy, también lo pendiente).
 */
export function fraseDia(
  fecha: string,
  hoy: string,
  conteo: Conteo,
  t: Textos = es.estadisticas,
): string {
  const { hechos: n, total } = conteo;
  const d = t.diario;
  if (fecha === hoy) return total === 0 ? d.hoyVacio : formatear(d.hoy, { n, total });
  if (fecha < hoy) {
    return total === 0
      ? d.pasadoVacio
      : formatear(d.pasado, { n, total, dia: nombreDia(fecha, t) });
  }
  if (total === 0) return d.futuroVacio;
  return mayuscula(
    formatear(total === 1 ? d.futuroUno : d.futuro, { total, dia: nombreDia(fecha, t) }),
  );
}

/** Encabezados de la semana: letra y número del día («L 16»); hoy en negritas. */
export function encabezadosSemana(
  actual: Periodo,
  hoy: string,
  t: Textos = es.estadisticas,
): { letra: string; numero: number; nombre: string; esHoy: boolean }[] {
  return actual.divisiones.map(({ desde }, i) => ({
    letra: t.diasCortos[i],
    numero: dia(desde),
    nombre: mayuscula(nombreDia(desde, t)),
    esHoy: desde === hoy,
  }));
}
