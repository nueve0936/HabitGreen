import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PlantaJardin } from '@/db/rewards-repository';
import { es, formatear } from '@/i18n/es';

import { imagenAccesorio, imagenPlanta } from '../imagenes';

// Panel de una planta (SDD 9.3 «PlantPanel»): fondo bg-claro, borde ink y la planta con sus
// accesorios apilados (todos comparten el mismo lienzo cuadrado, SDD 9.8). Nunca muestra XP ni
// niveles; lo que lleva puesto también se dice con texto, no solo con la imagen.

export type PlantPanelProps = {
  planta: PlantaJardin;
  /** Texto bajo la planta (en el Jardín); en la pantalla de la planta se omite. */
  conDetalle?: boolean;
  onPress?: () => void;
};

export function PlantPanel({ planta, conDetalle = true, onPress }: PlantPanelProps) {
  const t = es.jardin;
  const categoria = es.onboarding.formulario.areas[planta.area];
  const fase = t.fases[Math.min(3, Math.max(1, planta.fase)) - 1];
  const lleva = planta.equipados.map((a) => a.nombre).join(', ');

  const contenido = (
    <>
      <View className="aspect-square w-full overflow-hidden rounded-card border-2 border-ink bg-bg-claro">
        <Image
          source={imagenPlanta(planta.area, planta.fase)}
          contentFit="contain"
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        {planta.equipados.map((a) => (
          <Image
            key={a.id}
            source={imagenAccesorio(a.tipo, a.orden)}
            contentFit="contain"
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />
        ))}
      </View>
      {conDetalle ? (
        <View className="gap-1">
          <AppText weight="semibold">{categoria}</AppText>
          {lleva ? <AppText variant="small">{formatear(t.lleva, { lista: lleva })}</AppText> : null}
          {planta.tieneHabitos ? null : (
            <AppText variant="small" tone="ink-soft">
              {t.sinHabitos}
            </AppText>
          )}
        </View>
      ) : null}
    </>
  );

  const etiqueta = [
    formatear(t.planta, { categoria, fase }),
    lleva ? formatear(t.lleva, { lista: lleva }) : null,
    planta.tieneHabitos ? null : t.sinHabitos,
  ]
    .filter(Boolean)
    .join('. ');

  if (!onPress) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={etiqueta} className="gap-2">
        {contenido}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={formatear(t.abrir, { categoria })}
      onPress={onPress}
      className="gap-2 rounded-card active:opacity-80"
    >
      {contenido}
    </Pressable>
  );
}
