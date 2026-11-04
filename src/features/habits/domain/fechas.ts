// Fechas de inicio y fin de un hábito (asistente de Crear hábito). El selector del mockup solo
// muestra mes y día: el año se deduce como la próxima vez que ocurre esa fecha a partir de la
// fecha mínima permitida. Fechas como texto "YYYY-MM-DD".

function dosDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Días que tiene un mes (1–12) de un año. */
export function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/**
 * Primera fecha con ese mes y día que no sea anterior a `minima`. Si el día no existe en ese mes
 * (29 de febrero en un año no bisiesto, 31 en un mes de 30), se usa el último día del mes.
 */
export function fechaDesdeMesDia(mes: number, dia: number, minima: string): string {
  const anioMinimo = Number(minima.slice(0, 4));
  for (const anio of [anioMinimo, anioMinimo + 1]) {
    const fecha = `${anio}-${dosDigitos(mes)}-${dosDigitos(Math.min(dia, diasDelMes(anio, mes)))}`;
    if (fecha >= minima) return fecha;
  }
  return minima;
}

/** «02/11/2026». */
export function textoFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Mes y día de una fecha "YYYY-MM-DD", para la posición inicial de las ruedas. */
export function mesYDia(fecha: string): { mes: number; dia: number } {
  return { mes: Number(fecha.slice(5, 7)), dia: Number(fecha.slice(8, 10)) };
}
