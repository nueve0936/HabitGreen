// Aviso único de los formularios de login y registro (mockups «Login/Registrar #1.x»): en lugar de
// un mensaje por campo, un solo aviso bajo los campos al pulsar el botón.

/**
 * `errores` son los mensajes de cada campo, en el orden de la pantalla. Si alguno es de «campo
 * vacío», se muestra `textoVacios`; si no, el primero.
 */
export function avisoDeFormulario(
  errores: readonly (string | undefined)[],
  mensajesVacio: readonly string[],
  textoVacios: string,
): string | null {
  const presentes = errores.filter((e): e is string => Boolean(e));
  if (presentes.length === 0) return null;
  if (presentes.some((e) => mensajesVacio.includes(e))) return textoVacios;
  return presentes[0] ?? null;
}
