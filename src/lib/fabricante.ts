import { Platform } from 'react-native';

// Marca del teléfono. Samsung pone en «suspensión» las apps que no se abren seguido y eso puede
// bloquear los avisos (ajustes, decisión del usuario del 22 nov): solo ahí se muestra la nota.

/** True en teléfonos Samsung con Android. */
export function esSamsung(): boolean {
  if (Platform.OS !== 'android') return false;
  const { Manufacturer, Brand } = Platform.constants as { Manufacturer?: string; Brand?: string };
  return [Manufacturer, Brand].some((m) => m?.toLowerCase() === 'samsung');
}
