import * as SecureStore from 'expo-secure-store';

// Adaptador de almacenamiento para la sesión de Supabase sobre expo-secure-store (definición 10).
// SecureStore avisa con valores de más de 2048 bytes y la sesión suele pasar de ese tamaño, así
// que el valor se guarda partido en trozos: `<clave>` guarda cuántos trozos hay y
// `<clave>.<n>` guarda cada trozo.

export const CHUNK_SIZE = 1800;

type SecureStoreApi = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'>;

// SecureStore solo acepta letras, números, «.», «-» y «_» en las claves.
export function sanitizeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

export function splitIntoChunks(value: string, size = CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += size) {
    chunks.push(value.slice(i, i + size));
  }
  return chunks.length > 0 ? chunks : [''];
}

export function createChunkedSecureStorage(store: SecureStoreApi = SecureStore) {
  async function readCount(key: string): Promise<number> {
    const raw = await store.getItemAsync(key);
    const count = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(count) && count > 0 ? count : 0;
  }

  async function removeItem(rawKey: string): Promise<void> {
    const key = sanitizeKey(rawKey);
    const count = await readCount(key);
    await Promise.all(
      Array.from({ length: count }, (_, i) => store.deleteItemAsync(`${key}.${i}`)),
    );
    await store.deleteItemAsync(key);
  }

  return {
    async getItem(rawKey: string): Promise<string | null> {
      const key = sanitizeKey(rawKey);
      const count = await readCount(key);
      if (count === 0) return null;
      const chunks = await Promise.all(
        Array.from({ length: count }, (_, i) => store.getItemAsync(`${key}.${i}`)),
      );
      // Si falta un trozo (por ejemplo, la app se cerró a mitad de una escritura), la sesión
      // está incompleta: es mejor no devolver nada y pedir iniciar sesión de nuevo.
      if (chunks.some((chunk) => chunk === null)) return null;
      return chunks.join('');
    },

    async setItem(rawKey: string, value: string): Promise<void> {
      const key = sanitizeKey(rawKey);
      await removeItem(key);
      const chunks = splitIntoChunks(value);
      await Promise.all(chunks.map((chunk, i) => store.setItemAsync(`${key}.${i}`, chunk)));
      // El contador se escribe al final: así una escritura a medias no parece completa.
      await store.setItemAsync(key, String(chunks.length));
    },

    removeItem,
  };
}
