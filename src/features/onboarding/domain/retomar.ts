import { TOTAL_PASOS, type Paso } from './form-rules';

// Retomar el formulario inicial donde se quedó (pulidos antes del APK, estados de inactividad).
// Si la app se cierra a mitad, al abrirla se rearma la pila de pantallas completa: así «atrás»
// sigue llevando al paso anterior, como si no se hubiera cerrado.

export type Retomar = { pantalla: 'formulario'; paso: Paso } | { pantalla: 'revision' };

export type RutaOnboarding =
  | { name: 'empezar' }
  | { name: 'modo' }
  | { name: 'formulario/[paso]'; params: { paso: string } }
  | { name: 'revision' };

function pasosHasta(paso: number): RutaOnboarding[] {
  return Array.from({ length: paso }, (_, i) => ({
    name: 'formulario/[paso]' as const,
    params: { paso: String(i + 1) },
  }));
}

/** Pila de pantallas para volver a `retomar`: Empezar, modo, los pasos hasta ahí y la revisión. */
export function pilaParaRetomar(retomar: Retomar): RutaOnboarding[] {
  const base: RutaOnboarding[] = [{ name: 'empezar' }, { name: 'modo' }];
  if (retomar.pantalla === 'formulario') return [...base, ...pasosHasta(retomar.paso)];
  return [...base, ...pasosHasta(TOTAL_PASOS), { name: 'revision' }];
}
