import { ZoneRedirect } from '@/features/auth/components/zone-redirect';

// Cualquier dirección desconocida (por ejemplo, un enlace viejo) lleva a la zona actual en vez
// de mostrar la pantalla «Unmatched Route».

export default function NotFound() {
  return <ZoneRedirect />;
}
