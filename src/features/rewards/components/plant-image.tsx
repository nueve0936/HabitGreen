import { Image } from 'expo-image';
import { View } from 'react-native';

import type { Accesorio } from '@/db/rewards-repository';
import { es, formatear } from '@/i18n/es';
import type { Area } from '@/schemas/onboarding';

import { cajaAccesorio, imagenAccesorio, imagenPlanta } from '../imagenes';

// La planta con sus accesorios colocados encima (SDD 9.8). Es decorativa: quien la usa da la
// descripción al lector de pantalla.

const CAPA = { position: 'absolute', width: '100%', height: '100%' } as const;

export type PlantImageProps = {
  area: Area;
  fase: number;
  equipados: readonly Accesorio[];
};

/** Descripción para el lector de pantalla: la fase en palabras, nunca con números. */
export function descripcionPlanta(area: Area, fase: number): string {
  return formatear(es.jardin.planta, {
    categoria: es.onboarding.formulario.areas[area],
    fase: es.jardin.fases[Math.min(3, Math.max(1, fase)) - 1],
  });
}

export function PlantImage({ area, fase, equipados }: PlantImageProps) {
  return (
    <View className="aspect-square w-full" importantForAccessibility="no-hide-descendants">
      <Image source={imagenPlanta(area, fase)} contentFit="contain" style={CAPA} />
      {equipados.map((a) => (
        <Image
          key={a.id}
          source={imagenAccesorio(a.tipo, a.orden)}
          contentFit="contain"
          style={{ position: 'absolute', aspectRatio: 1, ...cajaAccesorio(a.tipo, fase) }}
        />
      ))}
    </View>
  );
}
