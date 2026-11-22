import { router } from 'expo-router';

import { crearCandado } from './candado';

// Navegación con un solo toque (decisión del usuario): si alguien toca dos veces muy rápido algo
// que abre o cierra una pantalla (una planta del Jardín, un hábito, «atrás»), el segundo cambio de
// pantalla en menos de 600 ms se ignora. Un solo candado para toda la app, así que cubre también los
// botones que se agreguen después. Úsalo en lugar de `router.push`, `replace`, `navigate`, `back` y
// `dismissTo`. `dismissAll` no lleva candado: se usa junto con otra navegación en la misma acción.

const candado = crearCandado();

export const navegar = {
  push: (...args: Parameters<typeof router.push>) => {
    candado.ejecutar(() => router.push(...args));
  },
  replace: (...args: Parameters<typeof router.replace>) => {
    candado.ejecutar(() => router.replace(...args));
  },
  navigate: (...args: Parameters<typeof router.navigate>) => {
    candado.ejecutar(() => router.navigate(...args));
  },
  back: () => {
    candado.ejecutar(() => router.back());
  },
  dismissTo: (...args: Parameters<typeof router.dismissTo>) => {
    candado.ejecutar(() => router.dismissTo(...args));
  },
  dismissAll: () => router.dismissAll(),
  canGoBack: () => router.canGoBack(),
};
