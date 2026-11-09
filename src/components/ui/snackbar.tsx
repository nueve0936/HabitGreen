import { useEffect, useEffectEvent } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Alert, type AlertVariant } from './alert';

// Aviso flotante y temporal, como el snackbar de Material: no mueve el contenido, deja pasar los
// toques a lo que tiene debajo y se quita solo. Se coloca como hermano de `Screen`, para que quede
// encima de la pantalla y no se desplace con ella. El lector de pantalla lo anuncia (`Alert`).

const DURACION = 5000;

export type SnackbarProps = {
  mensaje: string | null;
  variant?: AlertVariant;
  onCerrar: () => void;
  /** Distancia al borde inferior. Sin barra de pestañas debajo, debe librar la barra del sistema. */
  margenInferior?: number;
};

export function Snackbar({
  mensaje,
  variant = 'exito',
  onCerrar,
  margenInferior = 16,
}: SnackbarProps) {
  const cerrar = useEffectEvent(onCerrar);

  useEffect(() => {
    if (mensaje === null) return;
    const temporizador = setTimeout(() => cerrar(), DURACION);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  if (mensaje === null) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      pointerEvents="none"
      style={{ position: 'absolute', left: 16, right: 16, bottom: margenInferior }}
    >
      <Alert variant={variant} message={mensaje} />
    </Animated.View>
  );
}
