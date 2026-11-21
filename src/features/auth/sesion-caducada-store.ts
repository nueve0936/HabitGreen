import Storage from 'expo-sqlite/kv-store';

// Lo que se recuerda en el teléfono sobre la sesión: la última conexión con el servidor y si la
// sesión caducó sola (para explicarlo en la bienvenida y el inicio de sesión). Se usa la versión
// síncrona del almacén clave-valor, como el borrador del formulario.

const ULTIMA_CONEXION = 'habitgreen-ultima-conexion';
const CADUCADA = 'habitgreen-sesion-caducada';

function leer(clave: string): string | null {
  try {
    return Storage.getItemSync(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string | null): void {
  try {
    if (valor === null) Storage.removeItemSync(clave);
    else Storage.setItemSync(clave, valor);
  } catch {
    // Sin este registro la app funciona igual.
  }
}

export function leerUltimaConexion(): number | null {
  const valor = Number(leer(ULTIMA_CONEXION));
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

export function marcarConexion(ahora: number = Date.now()): void {
  escribir(ULTIMA_CONEXION, String(ahora));
}

export function sesionCaducada(): boolean {
  return leer(CADUCADA) === '1';
}

export function marcarSesionCaducada(caducada: boolean): void {
  escribir(CADUCADA, caducada ? '1' : null);
}
