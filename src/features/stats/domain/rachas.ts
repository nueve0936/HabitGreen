// Rachas por hábito (SDD 8): ocurrencias programadas seguidas que se completaron. Los días no
// programados no la rompen porque no son ocurrencias; una no hecha (o descartada) sí. Nunca se
// dice «perdiste tu racha»: al romperse se destaca la mejor con una invitación a retomar.

export type Racha = { actual: number; mejor: number };

/** `ocurrencias` de un solo hábito, en orden de fecha. */
export function rachaDeHabito(ocurrencias: readonly { hecho: boolean }[]): Racha {
  let actual = 0;
  let mejor = 0;
  for (const o of ocurrencias) {
    actual = o.hecho ? actual + 1 : 0;
    mejor = Math.max(mejor, actual);
  }
  return { actual, mejor };
}

export type TextosRacha = {
  rachaActual: string;
  mejorRacha: string;
  rachaRota: string;
};

export type LineaRacha = { texto: keyof TextosRacha; n: number }[];

/**
 * Qué decir de la racha. Con `desanimo`, solo la mejor. Si la actual va en curso, se dice, y la
 * mejor solo si es mayor. Si se rompió, la mejor con invitación. Sin ninguna, nada.
 */
export function lineaDeRacha(racha: Racha, desanimo: boolean): LineaRacha {
  if (racha.mejor === 0) return [];
  if (desanimo) return [{ texto: 'mejorRacha', n: racha.mejor }];
  if (racha.actual === 0) return [{ texto: 'rachaRota', n: racha.mejor }];
  const linea: LineaRacha = [{ texto: 'rachaActual', n: racha.actual }];
  if (racha.mejor > racha.actual) linea.push({ texto: 'mejorRacha', n: racha.mejor });
  return linea;
}

export type PildoraRacha = { tipo: 'actual' | 'mejor'; n: number };

/**
 * La píldora con la llama: la racha en curso, o «Mejor: n» si se rompió. Con `desanimo`, siempre
 * la mejor. Sin ninguna racha todavía, no hay píldora.
 */
export function pildoraDeRacha(racha: Racha, desanimo: boolean): PildoraRacha | null {
  if (racha.mejor === 0) return null;
  if (desanimo || racha.actual === 0) return { tipo: 'mejor', n: racha.mejor };
  return { tipo: 'actual', n: racha.actual };
}
