import { CalendarArrowRight } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

import type { Propuesta } from '../domain/reprogramar';
import { destinoDia } from '../domain/texto-dia';

// Tarjeta de reprogramación en Hoy (SDD 6.2): arriba de la lista y dentro de lo que se desplaza,
// para no quitarle espacio fijo a los hábitos. Tono neutro: «Movimos… Puedes cambiarlo». Los
// botones van con borde (secundarios) para no competir con marcar los hábitos; si no caben en un
// renglón (letra grande), se apilan. Sin día libre, solo se avisa con «Entendido».

export type RescheduleCardProps = {
  propuesta: Propuesta;
  hoy: string;
  /** Posición entre las propuestas de hoy («1 de 2»); no se muestra si hay una sola. */
  indice: number;
  total: number;
  ocupado: boolean;
  onAceptar: () => void;
  onOtroDia: () => void;
  onDejar: () => void;
};

export function RescheduleCard({
  propuesta,
  hoy,
  indice,
  total,
  ocupado,
  onAceptar,
  onOtroDia,
  onDejar,
}: RescheduleCardProps) {
  const t = es.reprogramar;
  const habito = propuesta.habito.titulo;
  const mensaje =
    propuesta.diaPropuesto === null
      ? formatear(t.sinDia, { habito })
      : formatear(t.propuesta, { habito, destino: destinoDia(propuesta.diaPropuesto, hoy) });

  return (
    <Card className="gap-4">
      <View className="flex-row gap-3">
        <View
          importantForAccessibility="no-hide-descendants"
          className="h-10 w-10 items-center justify-center rounded-chip bg-accent-claro"
        >
          <CalendarArrowRight size={22} color={colors.accent} />
        </View>
        <View className="flex-1 gap-1">
          <AppText>{mensaje}</AppText>
          {total > 1 ? (
            <AppText variant="small" tone="ink-soft">
              {formatear(t.contador, { n: indice, total })}
            </AppText>
          ) : null}
        </View>
      </View>

      {propuesta.diaPropuesto === null ? (
        <Button variant="secondary" label={t.entendido} disabled={ocupado} onPress={onDejar} />
      ) : (
        <View className="gap-1">
          <View className="flex-row flex-wrap gap-3">
            <Button
              variant="secondary"
              label={t.otroDia}
              disabled={ocupado}
              onPress={onOtroDia}
              className="grow"
            />
            <Button
              variant="secondary"
              label={t.aceptar}
              disabled={ocupado}
              onPress={onAceptar}
              className="grow"
            />
          </View>
          <Button variant="tertiary" label={t.dejar} disabled={ocupado} onPress={onDejar} />
        </View>
      )}
    </Card>
  );
}
