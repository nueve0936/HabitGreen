import { es, formatear } from '@/i18n/es';
import { diaIso, diasEntre } from '@/lib/dates';

// Cómo se nombra el día destino de una reprogramación: «a hoy», «a mañana», «al jueves 19» en la
// tarjeta, y «Hoy», «Mañana», «Jue 19» en el selector de días.

type TextosDia = Pick<
  typeof es.reprogramar,
  | 'destinoHoy'
  | 'destinoManana'
  | 'destinoDia'
  | 'cortoHoy'
  | 'cortoManana'
  | 'cortoDia'
  | 'dias'
  | 'diasCortos'
>;

export function destinoDia(fecha: string, hoy: string, t: TextosDia = es.reprogramar): string {
  const distancia = diasEntre(hoy, fecha);
  if (distancia === 0) return t.destinoHoy;
  if (distancia === 1) return t.destinoManana;
  return formatear(t.destinoDia, { dia: t.dias[diaIso(fecha) - 1], n: Number(fecha.slice(8)) });
}

export function diaCorto(fecha: string, hoy: string, t: TextosDia = es.reprogramar): string {
  const distancia = diasEntre(hoy, fecha);
  if (distancia === 0) return t.cortoHoy;
  if (distancia === 1) return t.cortoManana;
  return formatear(t.cortoDia, { dia: t.diasCortos[diaIso(fecha) - 1], n: Number(fecha.slice(8)) });
}
