import { useEffect, useState } from 'react';
import Animated, { FadeOut } from 'react-native-reanimated';

import { Alert } from '@/components/ui/alert';
import { es } from '@/i18n/es';

import { msRestantesAviso, SEGUNDOS_AVISO_CADUCADA } from '../domain/sesion-caducada';
import { marcarSesionCaducada, sesionCaducada } from '../sesion-caducada-store';

// «Tu sesión caducó…» en la bienvenida y el inicio de sesión, cuando la sesión se cerró sola (60 días
// sin conexión o cerrada en otro lado). Se ve una sola vez y se quita a los 10 segundos: al
// mostrarse se apaga la marca guardada y aquí se recuerda cuándo vence, para que al pasar de una
// pantalla a otra siga solo el tiempo que le queda. Al quitarse se desvanece en 250 ms (guía:
// movimiento sobrio); con «Quitar animaciones» del sistema, Reanimated lo quita sin animar.

const MS_DESVANECER = 250;

let venceAviso: number | null = null;

function tiempoRestante(): number {
  if (sesionCaducada()) {
    venceAviso = Date.now() + SEGUNDOS_AVISO_CADUCADA * 1000;
    marcarSesionCaducada(false);
  }
  return msRestantesAviso(venceAviso, Date.now());
}

export function SessionExpiredNotice() {
  const [restante] = useState(tiempoRestante);
  const [visible, setVisible] = useState(restante > 0);

  useEffect(() => {
    if (!visible) return;
    const temporizador = setTimeout(() => setVisible(false), restante);
    return () => clearTimeout(temporizador);
  }, [visible, restante]);

  if (!visible) return null;
  return (
    <Animated.View exiting={FadeOut.duration(MS_DESVANECER)}>
      <Alert variant="info" message={es.auth.sesionCaducada} />
    </Animated.View>
  );
}
