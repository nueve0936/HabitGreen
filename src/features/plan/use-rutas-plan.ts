import type { Href } from 'expo-router';

import { useAppZone } from '@/features/auth/use-app-zone';

// El formulario y la revisión del plan se usan en dos lugares: en la bienvenida (primer plan,
// zona «onboarding») y desde la app (Perfil → Mis planes → Crear plan, zona «tabs»). Las pantallas
// son las mismas; solo cambian sus rutas.

export type RutasPlan = {
  /** true si se crea el plan desde la app (ya dentro de las pestañas). */
  enApp: boolean;
  paso: (n: number) => Href;
  generando: Href;
  revision: Href;
  sugerencias: Href;
};

export function useRutasPlan(): RutasPlan {
  const enApp = useAppZone() === 'tabs';
  if (enApp) {
    return {
      enApp,
      paso: (n) => ({ pathname: '/plan-nuevo/[paso]', params: { paso: String(n) } }),
      generando: '/plan-nuevo/generando',
      revision: '/plan-nuevo/revision',
      sugerencias: '/plan-nuevo/sugerencias',
    };
  }
  return {
    enApp,
    paso: (n) => ({ pathname: '/formulario/[paso]', params: { paso: String(n) } }),
    generando: '/plan',
    revision: '/revision',
    sugerencias: '/sugerencias',
  };
}
