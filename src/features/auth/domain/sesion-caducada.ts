// Sesión sin conexión (decisión del usuario, pulidos antes del APK): sin internet la app sigue
// abierta con la sesión guardada, pero si pasan más de 60 días sin ninguna conexión con el
// servidor, la sesión caduca y hay que volver a entrar. Lo hecho sin conexión no se borra: se sube
// al entrar con la misma cuenta.

export const DIAS_SIN_CONEXION = 60;
const MS_POR_DIA = 86_400_000;

/** True si desde la última conexión pasaron más de 60 días. Sin registro, no caduca. */
export function caducoSinConexion(ultimaConexion: number | null, ahora: number): boolean {
  return ultimaConexion !== null && ahora - ultimaConexion > DIAS_SIN_CONEXION * MS_POR_DIA;
}

// El aviso «Tu sesión caducó…» se ve una sola vez y se quita solo a los 10 segundos (decisión del
// usuario). Si se pasa de la bienvenida al inicio de sesión, ahí sigue solo el tiempo que le queda.
export const SEGUNDOS_AVISO_CADUCADA = 10;

/** Milisegundos que le quedan al aviso; 0 si ya venció o nunca se mostró. */
export function msRestantesAviso(vence: number | null, ahora: number): number {
  return vence === null ? 0 : Math.max(0, vence - ahora);
}
