import type { SQLiteDatabase } from 'expo-sqlite';

import {
  cambiosAlEquipar,
  plantaParaEquipar,
  type TipoAccesorio,
} from '@/features/rewards/domain/equipar';
import { supabase } from '@/lib/supabase';
import { AREAS, type Area } from '@/schemas/onboarding';
import { esRechazoDefinitivo } from '@/sync/domain/sync-rules';
import { pedirSincronizacion, sincronizarAhora } from '@/sync/sync-engine';

import { actualizarFila, enTransaccion, getDb, leerFilas } from './database';
import { avisarCambioLocal } from './db-version-store';
import { encolar } from './outbox';

// Jardín y tienda (SDD 6.4 y 9.4). Se lee de SQLite. Equipar funciona sin conexión (cola de
// salida); comprar no, porque el servidor revisa el saldo real.

export type Accesorio = {
  id: string;
  tipo: TipoAccesorio;
  nombre: string;
  precio: number;
  orden: number;
  /** id de user_accessories si ya es del usuario. */
  propioId: string | null;
  /** category_id de la planta que lo lleva puesto. */
  categoriaEquipada: string | null;
};

export type PlantaJardin = {
  area: Area;
  categoryId: string;
  fase: number;
  tieneHabitos: boolean;
  equipados: Accesorio[];
};

export type Jardin = { plantas: PlantaJardin[]; accesorios: Accesorio[]; saldo: number };

const ORDEN_TIPOS: TipoAccesorio[] = ['maceta', 'lentes', 'sombrero'];

async function leerAccesorios(db: SQLiteDatabase, userId: string): Promise<Accesorio[]> {
  const catalogo = await leerFilas<Omit<Accesorio, 'propioId' | 'categoriaEquipada'>>(
    db,
    'accessories',
    '1 = 1 ORDER BY tipo, orden',
  );
  const propios = await leerFilas<{
    id: string;
    accessory_id: string;
    categoria_equipada: string | null;
  }>(db, 'user_accessories', 'user_id = ? AND eliminado_en IS NULL', [userId]);
  return catalogo.map((a) => {
    const propio = propios.find((p) => p.accessory_id === a.id);
    return {
      ...a,
      propioId: propio?.id ?? null,
      categoriaEquipada: propio?.categoria_equipada ?? null,
    };
  });
}

async function leerSaldo(db: SQLiteDatabase, userId: string): Promise<number> {
  const fila = await db.getFirstAsync<{ saldo: number }>(
    'SELECT saldo FROM wallets WHERE user_id = ?',
    [userId],
  );
  return fila?.saldo ?? 0;
}

/** Las 5 plantas (aunque el área no tenga hábitos), su fase y lo que llevan puesto. */
export async function leerJardin(userId: string): Promise<Jardin> {
  const db = await getDb();
  const categorias = await db.getAllAsync<{ id: string; clave: string }>(
    'SELECT id, clave FROM categories WHERE user_id IS NULL',
  );
  const progreso = await db.getAllAsync<{ category_id: string; fase: number }>(
    'SELECT category_id, fase FROM plant_progress WHERE user_id = ?',
    [userId],
  );
  const conHabitos = await db.getAllAsync<{ category_id: string }>(
    'SELECT DISTINCT category_id FROM habits WHERE activo = 1 AND archivado_en IS NULL',
  );
  const accesorios = await leerAccesorios(db, userId);

  const plantas = AREAS.flatMap((area) => {
    const categoria = categorias.find((c) => c.clave === area);
    if (!categoria) return [];
    return [
      {
        area,
        categoryId: categoria.id,
        fase: progreso.find((p) => p.category_id === categoria.id)?.fase ?? 1,
        tieneHabitos: conHabitos.some((h) => h.category_id === categoria.id),
        equipados: accesorios
          .filter((a) => a.categoriaEquipada === categoria.id)
          .sort((a, b) => ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo)),
      },
    ];
  });
  return { plantas, accesorios, saldo: await leerSaldo(db, userId) };
}

/**
 * Pone el accesorio en la planta (o lo quita con null). Si estaba en otra planta, devuelve esa
 * categoría para avisar «Lo movimos…».
 */
export async function equiparAccesorio(
  userId: string,
  accesorio: Accesorio,
  categoryId: string | null,
): Promise<{ movidoDe: string | null }> {
  if (accesorio.propioId === null) throw new Error('El accesorio no es del usuario');
  const propioId = accesorio.propioId;
  const db = await getDb();
  const propios = (await leerAccesorios(db, userId)).flatMap((a) =>
    a.propioId === null
      ? []
      : [{ id: a.propioId, tipo: a.tipo, categoria_equipada: a.categoriaEquipada }],
  );
  const actual = propios.find((p) => p.id === propioId);
  if (!actual) throw new Error('El accesorio no es del usuario');

  await enTransaccion(db, async () => {
    const ahora = new Date().toISOString();
    for (const cambio of cambiosAlEquipar(actual, categoryId, propios)) {
      const datos = { categoria_equipada: cambio.categoria_equipada };
      await actualizarFila(
        db,
        'user_accessories',
        { id: cambio.id },
        { ...datos, updated_at: ahora },
      );
      await encolar(db, {
        operacion: 'update',
        tabla: 'user_accessories',
        clave: cambio.id,
        payload: datos,
      });
    }
  });
  avisarCambioLocal();
  pedirSincronizacion();
  const anterior = actual.categoria_equipada;
  return {
    movidoDe: categoryId !== null && anterior !== null && anterior !== categoryId ? anterior : null,
  };
}

/**
 * «Equipar ahora» en la Tienda (SDD 9.4). Con `origen`, lo pone en la planta desde la que se abrió
 * la Tienda; si ya lo lleva una planta, no lo mueve; si no, la app elige. Devuelve dónde quedó, o
 * null si el objeto todavía no llega a este teléfono, para que el usuario pueda reintentar.
 */
export async function equiparDesdeTienda(
  userId: string,
  accessoryId: string,
  origen: Area | null,
): Promise<{ area: Area; tipo: TipoAccesorio } | null> {
  let jardin = await leerJardin(userId);
  let accesorio = jardin.accesorios.find((a) => a.id === accessoryId);
  if (accesorio?.propioId == null) {
    await sincronizarAhora().catch(() => {});
    jardin = await leerJardin(userId);
    accesorio = jardin.accesorios.find((a) => a.id === accessoryId);
  }
  if (!accesorio || accesorio.propioId === null) return null;

  const origenId = jardin.plantas.find((p) => p.area === origen)?.categoryId ?? null;
  const destino =
    origenId ?? accesorio.categoriaEquipada ?? plantaParaEquipar(accesorio.tipo, jardin.plantas);
  const planta = jardin.plantas.find((p) => p.categoryId === destino);
  if (!planta) return null;

  await equiparAccesorio(userId, accesorio, planta.categoryId);
  return { area: planta.area, tipo: accesorio.tipo };
}

export type ResultadoCompra = 'comprado' | 'sin_conexion' | 'saldo_insuficiente' | 'error';

/** Compra en el servidor (necesita conexión) y después descarga el saldo y el accesorio. */
export async function comprarAccesorio(accessoryId: string): Promise<ResultadoCompra> {
  const { error } = await supabase.rpc('comprar_accesorio', { p_accessory_id: accessoryId });
  if (error) {
    if (!esRechazoDefinitivo(error)) return 'sin_conexion';
    return error.message === 'saldo_insuficiente' ? 'saldo_insuficiente' : 'error';
  }
  await sincronizarAhora().catch(() => {});
  return 'comprado';
}
