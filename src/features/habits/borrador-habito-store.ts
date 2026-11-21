import Storage from 'expo-sqlite/kv-store';

import { borradorParaHoy, type BorradorHabito } from './domain/borrador-habito';

// Dónde vive el borrador del asistente: el almacén clave-valor de expo-sqlite, como las respuestas
// del formulario inicial. Se usa la versión síncrona para tenerlo antes de dibujar la pantalla.

const CLAVE = 'habitgreen-borrador-habito';

export function leerBorradorHabito(userId: string, hoy: string): BorradorHabito | null {
  try {
    const texto = Storage.getItemSync(CLAVE);
    return borradorParaHoy(texto ? (JSON.parse(texto) as BorradorHabito) : null, userId, hoy);
  } catch {
    return null;
  }
}

export function guardarBorradorHabito(borrador: BorradorHabito): void {
  try {
    Storage.setItemSync(CLAVE, JSON.stringify(borrador));
  } catch {
    // Sin borrador la app funciona igual: solo no se podría retomar.
  }
}

export function borrarBorradorHabito(): void {
  try {
    Storage.removeItemSync(CLAVE);
  } catch {
    // Nada que borrar.
  }
}
