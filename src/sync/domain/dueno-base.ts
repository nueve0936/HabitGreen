// La base local guarda los datos de una sola cuenta (SDD 3.4). Al entrar se compara su dueño con
// la cuenta que inició sesión:
//   - la misma cuenta: se conserva todo, incluido lo hecho sin conexión que falta subir;
//   - otra cuenta: se vacía antes de mostrar nada, porque sin la sesión de su dueño no se puede
//     subir y no debe verse;
//   - sin dueño anotado (base nueva o recién vaciada): solo se anota.

export type AccionDueno = 'mantener' | 'vaciar' | 'anotar';

export function accionDueno(duenoGuardado: string | null, userId: string): AccionDueno {
  if (duenoGuardado === null) return 'anotar';
  return duenoGuardado === userId ? 'mantener' : 'vaciar';
}
