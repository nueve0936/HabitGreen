import { supabase } from '@/lib/supabase';

import { getDb, guardarFilas } from './database';

// Repositorio del perfil. Se lee de Supabase y se guarda una copia en SQLite: si no hay conexión
// al abrir la app, se usa la copia local para llegar a las pestañas (SDD 3.4). El modo y el
// onboarding se guardan con conexión, porque crear el plan ya la necesita.

export type AppMode = 'tradicional' | 'guiado';

export type Profile = {
  id: string;
  nombre: string | null;
  zonaHoraria: string;
  modo: AppMode | null;
  onboardingCompleto: boolean;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
  zona_horaria: string;
  modo: AppMode | null;
  onboarding_completo: boolean;
  updated_at?: string;
};

const COLUMNS = 'id, nombre, zona_horaria, modo, onboarding_completo, updated_at';

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    nombre: row.nombre,
    zonaHoraria: row.zona_horaria,
    modo: row.modo,
    onboardingCompleto: row.onboarding_completo,
  };
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .eq('id', userId)
    .maybeSingle<ProfileRow>();
  if (error) throw error;
  return data;
}

async function guardarCopia(row: ProfileRow): Promise<void> {
  await guardarFilas(await getDb(), 'profiles', [row]);
}

async function leerCopia(userId: string): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<
    Omit<ProfileRow, 'onboarding_completo'> & { onboarding_completo: number }
  >('SELECT id, nombre, zona_horaria, modo, onboarding_completo FROM profiles WHERE id = ?', [
    userId,
  ]);
  return row ? toProfile({ ...row, onboarding_completo: row.onboarding_completo === 1 }) : null;
}

export async function getProfile(userId: string): Promise<Profile> {
  let row: ProfileRow | null;
  try {
    row = await fetchProfile(userId);
  } catch (error) {
    // Sin conexión (o el servidor no respondió): se usa la copia local si existe.
    const copia = await leerCopia(userId).catch(() => null);
    if (copia) return copia;
    throw error;
  }
  if (row) {
    await guardarCopia(row);
    return toProfile(row);
  }

  // La cuenta existe pero le falta el perfil (por ejemplo, se borró a mano en pruebas):
  // la función del servidor lo vuelve a crear junto con su monedero y sus plantas.
  const { error } = await supabase.rpc('ensure_profile');
  if (error) throw error;
  const created = await fetchProfile(userId);
  if (!created) throw new Error('No se pudo crear el perfil');
  await guardarCopia(created);
  return toProfile(created);
}

/** Guarda el modo y cierra la bienvenida: es el último paso del onboarding en los dos modos. */
export async function saveMode(
  userId: string,
  modo: AppMode,
  zonaHoraria: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ modo, zona_horaria: zonaHoraria, onboarding_completo: true })
    .eq('id', userId)
    .select(COLUMNS)
    .single<ProfileRow>();
  if (error) throw error;
  await guardarCopia(data);
  return toProfile(data);
}
