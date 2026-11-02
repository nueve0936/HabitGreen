import { Redirect } from 'expo-router';

import { useAppZone, ZONE_HOME } from '../use-app-zone';

// Lleva a la primera pantalla de la zona actual (cuenta, bienvenida, recuperación o pestañas).
// Lo usan la entrada de la app (/) y las direcciones desconocidas.

export function ZoneRedirect() {
  const zone = useAppZone();
  // El layout raíz no muestra pantallas en estos dos estados; aquí solo por seguridad.
  if (zone === 'loading' || zone === 'profile-error') return null;
  return <Redirect href={ZONE_HOME[zone]} />;
}
