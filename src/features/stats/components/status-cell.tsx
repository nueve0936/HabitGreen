import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import type { EstadoDia } from '@/features/stats/domain/cumplimiento';
import { colors } from '@/theme';

// Celda de un día en las cuadrículas de Progreso. Cada estado tiene su forma, no solo su color:
// hecho = relleno verde (con ✓ si cabe), sin marcar = contorno, pendiente o «te toca» = contorno
// punteado (verde si es hoy), no le toca = un punto. `vacio` es un hueco del calendario (antes del
// primer día o fuera del mes).

export type StatusCellProps = {
  estado: EstadoDia | null;
  /** Lado en dp: 32 en la semana, 12 en el mes. */
  lado: number;
  vacio?: boolean;
};

export function StatusCell({ estado, lado, vacio = false }: StatusCellProps) {
  const chica = lado < 20;
  const radio = chica ? 3 : 10;
  const borde = chica ? 1.5 : 2;
  const base = { width: lado, height: lado, borderRadius: radio };

  if (vacio) return <View style={base} />;
  if (estado === null) {
    const punto = chica ? 3 : 6;
    return (
      <View style={base} className="items-center justify-center">
        <View style={{ width: punto, height: punto, borderRadius: punto }} className="bg-borde" />
      </View>
    );
  }
  if (estado === 'hecho') {
    return (
      <View style={base} className="items-center justify-center bg-accent">
        {chica ? null : <Check size={16} strokeWidth={3} color={colors.blanco} />}
      </View>
    );
  }
  return (
    <View
      style={[
        base,
        {
          borderWidth: borde,
          borderStyle: estado === 'sin_marcar' ? 'solid' : 'dashed',
          borderColor: estado === 'pendiente' ? colors.accent : colors.borde,
        },
      ]}
      className={estado === 'sin_marcar' ? 'bg-campo' : ''}
    />
  );
}
