import { supabase } from '@/lib/supabase';

// Repositorio del perfil. En la Entrega 1 lee y escribe directo en Supabase; en la Entrega 3
// pasa a SQLite con sincronización, sin que cambien las pantallas que lo usan.

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
};

const COLUMNS = 'id, nombre, zona_horaria, modo, onboarding_completo';

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

export async function getProfile(userId: string): Promise<Profile> {
  const row = await fetchProfile(userId);
  if (row) return toProfile(row);

  // La cuenta existe pero le falta el perfil (por ejemplo, se borró a mano en pruebas):
  // la función del servidor lo vuelve a crear junto con su monedero y sus plantas.
  const { error } = await supabase.rpc('ensure_profile');
  if (error) throw error;
  const created = await fetchProfile(userId);
  if (!created) throw new Error('No se pudo crear el perfil');
  return toProfile(created);
}

export async function saveMode(
  userId: string,
  modo: AppMode,
  zonaHoraria: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ modo, zona_horaria: zonaHoraria })
    .eq('id', userId)
    .select(COLUMNS)
    .single<ProfileRow>();
  if (error) throw error;
  return toProfile(data);
}
