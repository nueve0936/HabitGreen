// Edge Function adjust-plan (SDD 6.3): redacta el título y la descripción de un hábito que cambió
// de nivel o que se agrega en la progresión. La decisión (nivel, duración, días) ya la tomó la app
// con reglas propias; aquí la IA solo escribe textos. El título base sale del catálogo, no de la
// app. Si la IA falla dos veces, se agota la cuota o se llega al límite diario, devuelve
// `textos: null` y la app se queda con los textos del catálogo. Lo único que escribe es una fila en
// ai_requests.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { AiCuotaError, crearProveedor } from '../_shared/ai-provider.ts';
import { elegirFilaCatalogo, type FilaCatalogo } from '../_shared/generated/plan-engine.ts';
import {
  peticionAjusteSchema,
  respuestaAjusteSchema,
  type RespuestaAjuste,
} from '../_shared/generated/plan.ts';
import { INSTRUCCIONES_ADJUST_PLAN } from '../_shared/prompts.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

/** Clave del proyecto: la variable clásica o la primera del diccionario de claves nuevas. */
function claveDelProyecto(clasica: string, nuevas: string): string {
  const valor = Deno.env.get(clasica);
  if (valor) return valor;
  const diccionario = JSON.parse(Deno.env.get(nuevas) ?? '{}') as Record<string, string>;
  const primera = Object.values(diccionario)[0];
  if (!primera) throw new Error(`Falta ${clasica} o ${nuevas}`);
  return primera;
}

const URL_PROYECTO = Deno.env.get('SUPABASE_URL') ?? '';
const CLAVE_PUBLICA = claveDelProyecto('SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEYS');
const CLAVE_SERVICIO = claveDelProyecto('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEYS');
const LIMITE_DIARIO = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '5');

// Estados de ai_requests. Solo cuentan para el límite los que sí llamaron a la IA.
type Estado = 'ok' | 'error' | 'cuota' | 'limite' | 'sin_proveedor';
const ESTADOS_CON_IA: Estado[] = ['ok', 'error', 'cuota'];

async function leerCatalogo(db: SupabaseClient): Promise<FilaCatalogo[]> {
  const { data, error } = await db
    .from('habit_catalog')
    .select(
      'objetivo, categoria, nivel, variante, titulo, descripcion, duracion_min, duracion_reducida_min, dias_semana, momento_fijo, sin_recursos',
    );
  if (error) throw error;
  return (data ?? []) as FilaCatalogo[];
}

async function usosDeHoy(admin: SupabaseClient, userId: string): Promise<number> {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('ai_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('funcion', 'adjust-plan')
    .in('estado', ESTADOS_CON_IA)
    .gte('creado_en', desde);
  if (error) throw error;
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return responder({ error: 'metodo_no_permitido' }, 405);

  // 1. Usuario de la sesión (el JWT viene en Authorization).
  const authorization = req.headers.get('Authorization') ?? '';
  const db = createClient(URL_PROYECTO, CLAVE_PUBLICA, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const token = authorization.replace(/^Bearer\s+/i, '');
  const { data: usuario, error: errorUsuario } = await db.auth.getUser(token);
  if (errorUsuario || !usuario.user) return responder({ error: 'no_autorizado' }, 401);
  const userId = usuario.user.id;

  // 2. Qué cambió: solo claves y números (nunca nombre ni correo).
  const cuerpo = await req.json().catch(() => null);
  const peticion = peticionAjusteSchema.safeParse(cuerpo);
  if (!peticion.success) return responder({ error: 'peticion_invalida' }, 400);
  const p = peticion.data;

  try {
    // 3. Título base del catálogo para ese objetivo y nivel.
    const fila = elegirFilaCatalogo(await leerCatalogo(db), p.objetivo, p.nivel, p.sin_recursos);

    // 4. Textos de la IA, con un reintento; si no, null.
    const admin = createClient(URL_PROYECTO, CLAVE_SERVICIO, { auth: { persistSession: false } });
    const proveedor = crearProveedor();
    let textos: RespuestaAjuste | null = null;
    let estado: Estado;
    let tokens = 0;

    if (proveedor === null) {
      estado = 'sin_proveedor';
    } else if ((await usosDeHoy(admin, userId)) >= LIMITE_DIARIO) {
      estado = 'limite';
    } else {
      estado = 'error';
      const mensaje = JSON.stringify({
        direccion: p.direccion,
        objetivo: p.objetivo,
        nivel: p.nivel,
        titulo_base: fila.titulo,
        duracion_min: p.duracion_min,
        dias_semana: p.dias_semana,
        historial: p.historial,
        obstaculo: p.obstaculo,
      });
      for (let intento = 1; intento <= 2; intento++) {
        try {
          const salida = await proveedor.generarJson(INSTRUCCIONES_ADJUST_PLAN, mensaje);
          tokens += salida.tokens ?? 0;
          const leida = respuestaAjusteSchema.safeParse(JSON.parse(salida.texto));
          if (leida.success) {
            textos = leida.data;
            estado = 'ok';
            break;
          }
          console.warn(`adjust-plan: respuesta de la IA no válida (intento ${intento})`);
        } catch (e) {
          if (e instanceof AiCuotaError) {
            estado = 'cuota';
            break;
          }
          console.warn(`adjust-plan: fallo de la IA (intento ${intento})`, e);
        }
      }
    }

    // 5. Solo se registra el uso; la app guarda los textos en su cola.
    const { error: errorRegistro } = await admin.from('ai_requests').insert({
      user_id: userId,
      funcion: 'adjust-plan',
      estado,
      tokens: tokens || null,
    });
    if (errorRegistro) console.error('adjust-plan: no se pudo registrar el uso', errorRegistro);

    return responder({ textos });
  } catch (e) {
    console.error('adjust-plan: error inesperado', e);
    return responder({ error: 'error_interno' }, 500);
  }
});
