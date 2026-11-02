// Copia el código compartido de la app a las Edge Functions (SDD 3.3).
// La app y la función usan los mismos esquemas y el mismo motor de plan; aquí se copian a
// supabase/functions/_shared/generated/ antes de servir o publicar las funciones.
// Deno pide la extensión en los imports relativos, así que se reescriben a "./archivo.ts".
// Los "zod" quedan igual y los resuelve el deno.json de cada función.
// Uso: node scripts/sync-shared.mjs   (lo corren `npm run functions:serve` y `functions:deploy`)

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'supabase/functions/_shared/generated');

const ARCHIVOS = [
  'src/schemas/onboarding.ts',
  'src/schemas/plan.ts',
  'src/features/plan/domain/plan-engine.ts',
];
const PERMITIDOS = new Set(['zod']);
const nombres = new Set(ARCHIVOS.map((a) => basename(a, '.ts')));

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

for (const archivo of ARCHIVOS) {
  const codigo = readFileSync(join(raiz, archivo), 'utf8');
  const reescrito = codigo.replace(/from '([^']+)'/g, (_, ruta) => {
    if (PERMITIDOS.has(ruta)) return `from '${ruta}'`;
    const nombre = basename(ruta);
    if (!ruta.startsWith('.') || !nombres.has(nombre)) {
      throw new Error(`${archivo} importa "${ruta}", que no se comparte con las Edge Functions.`);
    }
    return `from './${nombre}.ts'`;
  });
  const cabecera = `// ARCHIVO GENERADO desde ${archivo} por scripts/sync-shared.mjs. No editar a mano.\n\n`;
  writeFileSync(join(destino, `${basename(archivo)}`), cabecera + reescrito);
}

console.log(`Código compartido copiado a ${destino}`);
