import { Image } from 'expo-image';
import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ChoicePill } from '@/components/ui/choice-pill';
import type { Accesorio, PlantaJardin } from '@/db/rewards-repository';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

import type { TipoAccesorio } from '../domain/equipar';
import { imagenAccesorio } from '../imagenes';

// Pestaña Objetos de Detalles (mockups «Detalles #2» y «#2.1»): los objetos comprados del tipo
// elegido, en 3 columnas. Tocar uno lo equipa al instante y tocar el puesto lo quita, sin
// confirmación. Las pestañas de tipo quedan fijas abajo.

export const TIPOS_OBJETO: TipoAccesorio[] = ['sombrero', 'lentes', 'maceta'];

// Los márgenes de la cuadrícula (`px-5`): en NativeWind, 1rem son 14 dp.
const MARGEN = 35;
const SEPARACION = 12;
// Las dos separaciones entre las 3 pestañas de tipo (`gap-2`).
const SEPARACION_TIPOS = 14;
// Lo que necesita la pestaña «Sombreros», la más larga, con letra normal.
const ANCHO_TIPO = 112;

export type ObjectGridProps = {
  planta: PlantaJardin;
  plantas: readonly PlantaJardin[];
  accesorios: readonly Accesorio[];
  tipo: TipoAccesorio;
  onCambiarTipo: (tipo: TipoAccesorio) => void;
  onTocar: (accesorio: Accesorio) => void;
  onIrATienda: () => void;
  margenInferior: number;
};

export function ObjectGrid({
  planta,
  plantas,
  accesorios,
  tipo,
  onCambiarTipo,
  onTocar,
  onIrATienda,
  margenInferior,
}: ObjectGridProps) {
  const t = es.planta;
  const { width, fontScale } = useWindowDimensions();
  const ancho = Math.floor((width - MARGEN - SEPARACION * 2) / 3);
  // En tercios iguales si caben; si no (letra grande o pantalla angosta), cada una toma lo que
  // necesita y pasan a otra fila, para no partir la palabra.
  const tiposIguales = (width - MARGEN - SEPARACION_TIPOS) / 3 >= ANCHO_TIPO * fontScale;
  const delTipo = accesorios.filter((a) => a.tipo === tipo && a.propioId !== null);

  const etiqueta = (a: Accesorio) => {
    if (a.categoriasEquipadas.includes(planta.categoryId)) {
      return formatear(t.objetoPuesto, { nombre: a.nombre });
    }
    const otras = plantas
      .filter((p) => a.categoriasEquipadas.includes(p.categoryId))
      .map((p) => es.onboarding.formulario.areas[p.area]);
    return otras.length > 0
      ? formatear(t.objetoEnOtra, { nombre: a.nombre, categorias: otras.join(', ') })
      : formatear(t.objetoLibre, { nombre: a.nombre });
  };

  return (
    <View className="flex-1">
      <ScrollView
        nestedScrollEnabled
        className="flex-1"
        contentContainerClassName="grow px-5 pb-4 pt-2"
      >
        {delTipo.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-4 py-6">
            <AppText tone="ink-soft" className="text-center">
              {formatear(t.sinObjetos, { tipo: t.tiposMinuscula[tipo] })}
            </AppText>
            <Button variant="secondary" label={t.irTienda} onPress={onIrATienda} />
          </View>
        ) : (
          <View style={{ gap: SEPARACION }} className="flex-row flex-wrap">
            {delTipo.map((a) => {
              const puesto = a.categoriasEquipadas.includes(planta.categoryId);
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityLabel={etiqueta(a)}
                  accessibilityState={{ selected: puesto }}
                  onPress={() => onTocar(a)}
                  style={{ width: ancho, height: ancho }}
                  className={`items-center justify-center rounded-card border-2 p-2 ${
                    puesto
                      ? 'border-accent bg-accent-claro'
                      : 'border-divisor bg-campo active:bg-accent-claro'
                  }`}
                >
                  <Image
                    source={imagenAccesorio(a.tipo, a.orden)}
                    contentFit="contain"
                    accessible={false}
                    style={{ width: '100%', height: '100%' }}
                  />
                  {puesto ? (
                    <View
                      style={{ borderRadius: 12 }}
                      className="absolute right-1 top-1 h-6 w-6 items-center justify-center bg-accent"
                    >
                      <Check size={16} color={colors.blanco} strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View
        accessibilityRole="radiogroup"
        style={{ paddingBottom: margenInferior + 8 }}
        className="flex-row flex-wrap gap-2 border-t border-divisor px-5 pt-2"
      >
        {TIPOS_OBJETO.map((opcion) => (
          <View key={opcion} className={tiposIguales ? 'flex-1' : 'grow'}>
            <ChoicePill
              label={t.tipos[opcion]}
              selected={tipo === opcion}
              onPress={() => onCambiarTipo(opcion)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
