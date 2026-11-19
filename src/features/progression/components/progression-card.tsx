import {
  Clock,
  Feather,
  HeartHandshake,
  Sprout,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

import type { Tarjeta } from '../domain/progresion';

// Tarjeta de progresión en Hoy (SDD 6.3), con el mismo acomodo que la de reprogramación: arriba de
// la lista, icono sobre verde rocío, el mensaje y botones con borde para no competir con marcar
// los hábitos. Tono sin culpa: subir se propone, bajar ya se hizo y se puede deshacer.

export type ProgressionCardProps = {
  tarjeta: Tarjeta;
  /** Posición entre las tarjetas de esta revisión («1 de 2»); no se muestra si hay una sola. */
  indice: number;
  total: number;
  ocupado: boolean;
  onAceptar: () => void;
  onCerrar: () => void;
  onMantener: () => void;
  onIrAPerfil: () => void;
};

type Contenido = {
  icono: LucideIcon;
  mensaje: string;
  principal: { label: string; onPress: () => void };
  secundario?: { label: string; onPress: () => void };
};

export function ProgressionCard({
  tarjeta,
  indice,
  total,
  ocupado,
  onAceptar,
  onCerrar,
  onMantener,
  onIrAPerfil,
}: ProgressionCardProps) {
  const t = es.progresion;

  const contenido = ((): Contenido => {
    switch (tarjeta.tipo) {
      case 'subir': {
        const { antes, despues } = tarjeta;
        const completa = antes.nivel === despues.nivel;
        return {
          icono: TrendingUp,
          mensaje: completa
            ? formatear(t.subirCompleta, { titulo: antes.titulo, min: despues.duracion_min })
            : formatear(t.subir, {
                actual: antes.titulo,
                titulo: despues.titulo,
                min: despues.duracion_min,
              }),
          principal: { label: t.siVamos, onPress: onAceptar },
          secundario: { label: t.masAdelante, onPress: onCerrar },
        };
      }
      case 'nuevo':
        return {
          icono: Sprout,
          mensaje: formatear(t.nuevo, { titulo: tarjeta.habito.titulo }),
          principal: { label: t.siVamos, onPress: onAceptar },
          secundario: { label: t.masAdelante, onPress: onCerrar },
        };
      case 'sin_espacio':
        return {
          icono: Clock,
          mensaje: t.sinEspacio,
          principal: { label: t.irAPerfil, onPress: onIrAPerfil },
          secundario: { label: t.entendido, onPress: onCerrar },
        };
      case 'bajar': {
        const { antes, despues } = tarjeta;
        const corta = antes.nivel === despues.nivel;
        return {
          icono: Feather,
          mensaje: corta
            ? formatear(t.bajarCorta, { titulo: antes.titulo, min: despues.duracion_min })
            : formatear(t.bajar, { actual: antes.titulo, titulo: despues.titulo }),
          principal: { label: t.entendido, onPress: onCerrar },
          secundario: { label: t.mantener, onPress: onMantener },
        };
      }
      case 'apoyo':
        return {
          icono: HeartHandshake,
          mensaje: formatear(t.apoyo, { titulo: tarjeta.titulo }),
          principal: { label: t.entendido, onPress: onCerrar },
        };
    }
  })();
  const Icono = contenido.icono;

  return (
    <Card className="gap-4">
      <View className="flex-row gap-3">
        <View
          importantForAccessibility="no-hide-descendants"
          style={{ width: 40, height: 40 }}
          className="items-center justify-center rounded-chip bg-accent-claro"
        >
          <Icono size={22} color={colors.accent} />
        </View>
        <View className="flex-1 gap-1">
          <AppText>{contenido.mensaje}</AppText>
          {total > 1 ? (
            <AppText variant="small" tone="ink-soft">
              {formatear(t.contador, { n: indice, total })}
            </AppText>
          ) : null}
        </View>
      </View>

      <View className="gap-1">
        <Button
          variant="secondary"
          label={contenido.principal.label}
          disabled={ocupado}
          onPress={contenido.principal.onPress}
        />
        {contenido.secundario ? (
          <Button
            variant="tertiary"
            label={contenido.secundario.label}
            disabled={ocupado}
            onPress={contenido.secundario.onPress}
          />
        ) : null}
      </View>
    </Card>
  );
}
