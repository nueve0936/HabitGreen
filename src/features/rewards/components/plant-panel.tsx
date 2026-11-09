import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PlantaJardin } from '@/db/rewards-repository';
import { es, formatear } from '@/i18n/es';
import { tintes } from '@/theme';

import { descripcionPlanta, PlantImage } from './plant-image';

// Tarjeta de una planta del Jardín (mockup «Plantas #1»): el tinte de su área, la planta con sus
// accesorios y el nombre de la categoría. Nunca muestra XP ni niveles; lo que lleva puesto se
// le dice también al lector de pantalla.

export type PlantPanelProps = {
  planta: PlantaJardin;
  onPress: () => void;
};

export function PlantPanel({ planta, onPress }: PlantPanelProps) {
  const t = es.jardin;
  const categoria = es.onboarding.formulario.areas[planta.area];
  const lleva = planta.equipados.map((a) => a.nombre).join(', ');

  const etiqueta = [
    descripcionPlanta(planta.area, planta.fase),
    lleva ? formatear(t.lleva, { lista: lleva }) : null,
    planta.tieneHabitos ? null : t.sinHabitos,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={formatear(t.abrir, { categoria })}
      onPress={onPress}
      style={{ backgroundColor: tintes[planta.area] }}
      className="grow gap-2 rounded-card p-3 active:opacity-80"
    >
      <PlantImage area={planta.area} fase={planta.fase} equipados={planta.equipados} />
      <View className="gap-1">
        <AppText weight="medium" className="text-center">
          {categoria}
        </AppText>
        {planta.tieneHabitos ? null : (
          <AppText variant="small" tone="ink-soft" className="text-center">
            {t.sinHabitosCorto}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}
