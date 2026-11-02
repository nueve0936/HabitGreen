// Variables públicas de la app. Expo las incrusta al compilar: se leen con process.env.NOMBRE
// literal (no con process.env[nombre]) para que el reemplazo funcione.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example como .env y llénalo.',
  );
}

export const env = { supabaseUrl, supabaseAnonKey };
