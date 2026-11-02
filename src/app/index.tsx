import { ZoneRedirect } from '@/features/auth/components/zone-redirect';

// Entrada de la app (habitgreen:/// o exp://.../--/). No tiene contenido: manda a la zona que
// corresponde según la sesión.

export default function Index() {
  return <ZoneRedirect />;
}
