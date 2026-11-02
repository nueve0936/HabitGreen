// Edge Function generate-plan (SDD 5.8): recibe las respuestas del formulario y devuelve un
// borrador del plan SIN guardarlo. Los números salen del motor y del catálogo; la IA solo redacta
// los textos. Si la IA falla dos veces, se agota la cuota o se llega al límite diario, se devuelven
// los textos del catálogo. Lo único que escribe es una fila en ai_requests.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { AiCuotaError, crearProveedor } from '../_shared/ai-provider.ts';
import { respuestasSchema, type Respuestas } from '../_shared/generated/onboarding.ts';
import {
  aplicarTextosIa,
  alternativasDeNivel,
  generarPlan,
  mensajeParaIa,
  type ConfigPlan,
  type FilaCatalogo,
} from '../_shared/generated/plan-engine.ts';
import { borradorPlanSchema, leerRespuestaIa, type BorradorPlan } from '../_shared/generated/plan.ts';
import { INSTRUCCIONES_GENERATE_PLAN } from '../_shared/prompts.ts';

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

const filaCatalogoSchema = z.object({
  objetivo: z.string(),
  categoria: z.string(),
  nivel: z.number(),
  variante: z.enum(['base', 'sin_recursos']),
  titulo: z.string(),
  descripcion: z.string().nullable(),
  duracion_min: z.number(),
  duracion_reducida_min: z.number(),
  dias_semana: z.array(z.number()),
  momento_fijo: z.string().nullable(),
  sin_recursos: z.boolean(),
});

const configSchema = z.object({
  presupuestos: z.object({
    menos_10: z.number(),
    '10_20': z.number(),
    '20_40': z.number(),
    mas_40: z.number(),
  }),
  horas: z.object({
    manana: z.string(),
    mediodia: z.string(),
    tarde: z.string(),
    noche: z.string(),
    flexible_aviso: z.string(),
    flexible_segundo_aviso: z.string(),
  }),
});

type Config = { motor: ConfigPlan; ventanaFlexible: BorradorPlan['ventana_flexible'] };

async function leerCatalogo(db: SupabaseClient, r: Respuestas): Promise<FilaCatalogo[]> {
  const { data, error } = await db
    .from('habit_catalog')
    .select(
      'objetivo, categoria, nivel, variante, titulo, descripcion, duracion_min, duracion_reducida_min, dias_semana, momento_fijo, sin_recursos',
    )
    .in('objetivo', r.objetivos);
  if (error) throw error;
  // Las claves del catálogo las valida el motor al buscar cada fila.
  return z.array(filaCatalogoSchema).parse(data) as FilaCatalogo[];
}

async function leerConfig(db: SupabaseClient): Promise<Config> {
  const { data, error } = await db
    .from('app_config')
    .select('clave, valor')
    .in('clave', ['presupuestos', 'horas_por_momento']);
  if (error) throw error;
  const porClave = Object.fromEntries((data ?? []).map((f) => [f.clave, f.valor]));
  const config = configSchema.parse({
    presupuestos: porClave.presupuestos,
    horas: porClave.horas_por_momento,
  });
  return {
    motor: config,
    ventanaFlexible: {
      inicio: config.horas.flexible_aviso,
      fin: config.horas.flexible_segundo_aviso,
    },
  };
}

async function usosDeHoy(admin: SupabaseClient, userId: string): Promise<number> {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('ai_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('funcion', 'generate-plan')
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

  // 2. Respuestas del formulario.
  const cuerpo = await req.json().catch(() => null);
  const respuestas = respuestasSchema.safeParse(cuerpo?.respuestas);
  if (!respuestas.success) return responder({ error: 'respuestas_invalidas' }, 400);
  const r = respuestas.data;

  try {
    // 3. Motor del plan con el catálogo y la configuración de la base de datos.
    const catalogo = await leerCatalogo(db, r);
    const config = await leerConfig(db);
    const plan = generarPlan(r, catalogo, config.motor);

    // 4 y 5. Textos de la IA, con un reintento; si no, se quedan los del catálogo.
    const admin = createClient(URL_PROYECTO, CLAVE_SERVICIO, { auth: { persistSession: false } });
    const proveedor = crearProveedor();
    let habitos = plan.habitos;
    let resumen: string | null = null;
    let estado: Estado;
    let tokens = 0;

    if (proveedor === null) {
      estado = 'sin_proveedor';
    } else if ((await usosDeHoy(admin, userId)) >= LIMITE_DIARIO) {
      estado = 'limite';
    } else {
      estado = 'error';
      const mensaje = mensajeParaIa(r, plan.habitos);
      for (let intento = 1; intento <= 2; intento++) {
        try {
          const salida = await proveedor.generarJson(INSTRUCCIONES_GENERATE_PLAN, mensaje);
          tokens += salida.tokens ?? 0;
          const textos = leerRespuestaIa(JSON.parse(salida.texto), r.objetivos);
          if (textos !== null) {
            habitos = aplicarTextosIa(plan.habitos, textos);
            resumen = textos.resumen;
            estado = 'ok';
            break;
          }
          console.warn(`generate-plan: respuesta de la IA no válida (intento ${intento})`);
        } catch (e) {
          if (e instanceof AiCuotaError) {
            estado = 'cuota';
            break;
          }
          console.warn(`generate-plan: fallo de la IA (intento ${intento})`, e);
        }
      }
    }

    // 6. Solo se registra el uso; el plan se guarda cuando el usuario pulsa «Empezar».
    const { error: errorRegistro } = await admin.from('ai_requests').insert({
      user_id: userId,
      funcion: 'generate-plan',
      estado,
      tokens: tokens || null,
    });
    if (errorRegistro) console.error('generate-plan: no se pudo registrar el uso', errorRegistro);

    const borrador: BorradorPlan = borradorPlanSchema.parse({
      origen: estado === 'ok' ? 'ia' : 'catalogo',
      resumen,
      habitos,
      ajustes: plan.ajustes,
      alternativas: alternativasDeNivel(r, catalogo, config.motor, plan.habitos),
      ventana_flexible: config.ventanaFlexible,
    });
    return responder(borrador);
  } catch (e) {
    console.error('generate-plan: error inesperado', e);
    return responder({ error: 'error_interno' }, 500);
  }
});
