import { useMemo, useState } from 'react';

import { leerDatosEstadisticas } from '@/db/stats-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { estaVisible } from '@/features/habits/domain/habitos-del-dia';
import { fechaLocal } from '@/lib/dates';
import { AREAS, type Area } from '@/schemas/onboarding';

import {
  estadosDelRango,
  habitosDeUnDia,
  historial,
  primerDia,
  rachasPorHabito,
  resumenDelPeriodo,
  type Estados,
} from './domain/cumplimiento';
import {
  hayAnterior,
  haySiguiente,
  mismoDiaEn,
  periodo,
  semanasDeTira,
  type Vista,
} from './domain/periodos';

// Estado de Progreso: la pestaña (Diario, Semanal o Mensual), Mes o Año dentro de Mensual, cuántos
// periodos atrás y el día elegido en Diario. Las pestañas son estado de esta pantalla y no rutas:
// la barra principal ya se desliza en horizontal, y así el día y el periodo se conservan al
// cambiar de vista. Los datos se leen de SQLite y se vuelven a leer con cada cambio local (marcar
// un hábito actualiza esta pantalla); los cálculos se memorizan.
//
// El filtro por área de Semanal y Mensual (`null` = «Todos») se conserva al cambiar de periodo y
// de pestaña; si el área se queda sin hábitos en el periodo que se ve, vuelve a «Todos».

export type Pestana = 'dia' | 'semana' | 'mes';
export type Escala = 'mes' | 'anio';

const SIN_ESTADOS: Estados = new Map();

export function useEstadisticas(userId: string) {
  const hoy = fechaLocal();
  const consulta = useLocalQuery(`estadisticas-${userId}`, () => leerDatosEstadisticas(userId));
  const [pestana, setPestana] = useState<Pestana>('dia');
  const [escala, setEscala] = useState<Escala>('mes');
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [diaElegido, setDiaElegido] = useState(hoy);
  const [area, setArea] = useState<Area | null>(null);
  // Cambió el día con la pantalla abierta: si veías hoy en Diario, pasas al nuevo hoy; si veías
  // otro día a propósito, te quedas ahí. Semanal y Mensual siguen solas al periodo actual.
  const [hoyVisto, setHoyVisto] = useState(hoy);
  if (hoyVisto !== hoy) {
    setHoyVisto(hoy);
    if (diaElegido === hoyVisto) setDiaElegido(hoy);
  }

  const datos = consulta.data;
  const vista: Vista = pestana === 'semana' ? 'semana' : escala;
  const ocurrencias = useMemo(() => (datos ? historial(datos, hoy) : []), [datos, hoy]);
  const rachas = useMemo(() => rachasPorHabito(ocurrencias), [ocurrencias]);
  const actual = useMemo(() => periodo(vista, hoy, desplazamiento), [vista, hoy, desplazamiento]);
  const resumen = useMemo(
    () => (datos ? resumenDelPeriodo(datos, ocurrencias, actual, AREAS, area) : null),
    [datos, ocurrencias, actual, area],
  );
  // El área elegida ya no tiene hábitos en este periodo: el filtro vuelve a «Todos». Se ajusta
  // durante el render (patrón de React para estado derivado) para no pintar un paso intermedio.
  if (pestana !== 'dia' && area !== null && resumen !== null && resumen.filtro === null) {
    setArea(null);
  }
  const estados = useMemo(
    () =>
      datos && pestana !== 'dia'
        ? estadosDelRango(datos, actual.desde, actual.hasta, hoy)
        : SIN_ESTADOS,
    [datos, pestana, actual, hoy],
  );
  const inicio = datos ? primerDia(datos) : null;
  const semanas = useMemo(() => semanasDeTira(inicio, hoy), [inicio, hoy]);
  const indiceSemana = Math.max(
    0,
    semanas.findIndex((s) => s.includes(diaElegido)),
  );
  // Con las flechas se pasa a la semana vecina y queda el mismo día de la semana.
  const irASemana = (indice: number) => {
    const destino = semanas[indice];
    if (destino) setDiaElegido((d) => mismoDiaEn(destino, d));
  };
  // El botón «Hoy» aparece cuando te alejaste: otro día en Diario u otro periodo en las demás.
  const lejosDeHoy = pestana === 'dia' ? diaElegido !== hoy : desplazamiento !== 0;
  const delDia = useMemo(
    () => (datos ? habitosDeUnDia(datos, diaElegido, hoy) : []),
    [datos, diaElegido, hoy],
  );
  const sinHabitos =
    datos !== undefined &&
    ocurrencias.length === 0 &&
    !datos.habitos.some((h) => estaVisible(h) && datos.categorias.has(h.category_id));

  return {
    hoy,
    cargando: consulta.cargando && !datos,
    error: consulta.error && !datos ? consulta.error : null,
    sinHabitos,
    desanimo: datos?.desanimo ?? false,
    pestana,
    escala,
    periodo: actual,
    resumen,
    area: resumen?.filtro ?? null,
    areasDisponibles: resumen?.areas ?? [],
    cambiarArea: setArea,
    estados,
    rachas,
    semanaVisible: semanas[indiceSemana] ?? [],
    puedeSemanaAnterior: indiceSemana > 0,
    puedeSemanaSiguiente: indiceSemana < semanas.length - 1,
    semanaAnterior: () => irASemana(indiceSemana - 1),
    semanaSiguiente: () => irASemana(indiceSemana + 1),
    diaElegido,
    lejosDeHoy,
    delDia,
    puedeAnterior: hayAnterior(actual, inicio),
    puedeSiguiente: haySiguiente(actual),
    cambiarPestana: (nueva: Pestana) => {
      setPestana(nueva);
      setDesplazamiento(0);
    },
    cambiarEscala: (nueva: Escala) => {
      setEscala(nueva);
      setDesplazamiento(0);
    },
    anterior: () => setDesplazamiento((d) => d - 1),
    siguiente: () => setDesplazamiento((d) => Math.min(0, d + 1)),
    elegirDia: setDiaElegido,
    irAHoy: () => {
      setDiaElegido(hoy);
      setDesplazamiento(0);
    },
  };
}
