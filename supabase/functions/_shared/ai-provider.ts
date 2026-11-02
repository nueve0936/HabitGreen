// Interfaz AiProvider (SDD 3.2): el resto del código no sabe qué proveedor de IA se usa.
// Se elige con los secretos AI_PROVIDER, AI_MODEL y AI_API_KEY. Por ahora solo está Gemini
// (nivel gratuito); Claude u OpenAI se agregan como otra implementación de esta interfaz.

export type RespuestaProveedor = {
  /** Texto que devolvió el modelo (se espera JSON). */
  texto: string;
  tokens: number | null;
};

export interface AiProvider {
  generarJson(instrucciones: string, mensaje: string): Promise<RespuestaProveedor>;
}

/** El proveedor rechazó la petición por cuota o límite de uso: no tiene caso reintentar. */
export class AiCuotaError extends Error {}

const TIEMPO_MAXIMO_MS = 20_000;

class GeminiProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelo: string,
  ) {}

  async generarJson(instrucciones: string, mensaje: string): Promise<RespuestaProveedor> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.modelo)}:generateContent`;
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instrucciones }] },
        contents: [{ role: 'user', parts: [{ text: mensaje }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });

    if (respuesta.status === 429) throw new AiCuotaError('Gemini: cuota agotada');
    if (!respuesta.ok) {
      throw new Error(`Gemini respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 300)}`);
    }

    const json = await respuesta.json();
    const partes: { text?: string }[] = json?.candidates?.[0]?.content?.parts ?? [];
    const texto = partes.map((p) => p.text ?? '').join('');
    if (texto === '') throw new Error('Gemini no devolvió texto');
    return { texto, tokens: json?.usageMetadata?.totalTokenCount ?? null };
  }
}

/** Proveedor configurado, o null si faltan secretos (entonces se usa el plan de catálogo). */
export function crearProveedor(): AiProvider | null {
  const proveedor = Deno.env.get('AI_PROVIDER') ?? 'gemini';
  const apiKey = Deno.env.get('AI_API_KEY');
  const modelo = Deno.env.get('AI_MODEL');
  if (!apiKey || !modelo) return null;

  switch (proveedor) {
    case 'gemini':
      return new GeminiProvider(apiKey, modelo);
    default:
      console.warn(`AI_PROVIDER "${proveedor}" todavía no está implementado; se usa el catálogo.`);
      return null;
  }
}
