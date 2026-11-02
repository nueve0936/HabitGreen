import { createChunkedSecureStorage, sanitizeKey, splitIntoChunks } from '../secure-storage';

jest.mock('expo-secure-store', () => ({}));

function createMemoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    getItemAsync: jest.fn(async (key: string) => data.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      data.delete(key);
    }),
  };
}

describe('splitIntoChunks', () => {
  it('parte el texto en trozos del tamaño indicado', () => {
    expect(splitIntoChunks('abcdefg', 3)).toEqual(['abc', 'def', 'g']);
  });

  it('guarda un texto vacío como un solo trozo', () => {
    expect(splitIntoChunks('', 3)).toEqual(['']);
  });
});

describe('sanitizeKey', () => {
  it('reemplaza los caracteres que SecureStore no acepta', () => {
    expect(sanitizeKey('sb-abc:auth token')).toBe('sb-abc_auth_token');
  });
});

describe('createChunkedSecureStorage', () => {
  it('guarda y recupera un valor largo partido en trozos', async () => {
    const store = createMemoryStore();
    const storage = createChunkedSecureStorage(store);
    const session = 'x'.repeat(4000);

    await storage.setItem('sb-proyecto-auth-token', session);

    expect(store.data.get('sb-proyecto-auth-token')).toBe('3');
    expect(await storage.getItem('sb-proyecto-auth-token')).toBe(session);
  });

  it('devuelve null si no hay nada guardado', async () => {
    const storage = createChunkedSecureStorage(createMemoryStore());
    expect(await storage.getItem('sin-valor')).toBeNull();
  });

  it('borra los trozos sobrantes al guardar un valor más corto', async () => {
    const store = createMemoryStore();
    const storage = createChunkedSecureStorage(store);

    await storage.setItem('clave', 'y'.repeat(4000));
    await storage.setItem('clave', 'corto');

    expect(await storage.getItem('clave')).toBe('corto');
    expect(store.data.has('clave.1')).toBe(false);
    expect(store.data.has('clave.2')).toBe(false);
  });

  it('elimina el valor y todos sus trozos', async () => {
    const store = createMemoryStore();
    const storage = createChunkedSecureStorage(store);

    await storage.setItem('clave', 'z'.repeat(2000));
    await storage.removeItem('clave');

    expect(store.data.size).toBe(0);
    expect(await storage.getItem('clave')).toBeNull();
  });

  it('descarta una sesión incompleta', async () => {
    const store = createMemoryStore();
    const storage = createChunkedSecureStorage(store);

    await storage.setItem('clave', 'w'.repeat(4000));
    store.data.delete('clave.1');

    expect(await storage.getItem('clave')).toBeNull();
  });
});
