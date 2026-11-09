import { Image } from 'expo-image';
import { Lock } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useReducedMotion } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import type { PlantaJardin } from '@/db/rewards-repository';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

import { estadoFase, FASES } from '../domain/estado-fase';
import { imagenPlanta } from '../imagenes';
import { descripcionPlanta, PlantImage } from './plant-image';

// Carrusel de las 3 fases de una planta (SDD 9.4, mockups «Detalles»): abre en la fase actual y se
// cambia deslizando o con los puntos, para no depender solo del gesto. Las fases no alcanzadas se ven
// como silueta con candado, y solo la fase actual lleva accesorios. Nunca muestra XP ni niveles.

export type PhaseCarouselProps = {
  planta: PlantaJardin;
  tamano: number;
  /** Se muestra entre la imagen y los puntos, como en el mockup. */
  children: ReactNode;
};

export function PhaseCarousel({ planta, tamano, children }: PhaseCarouselProps) {
  const t = es.planta;
  const reducirMovimiento = useReducedMotion();
  const pager = useRef<PagerView>(null);
  const [vista, setVista] = useState(planta.fase - 1);
  const lleva = planta.equipados.map((a) => a.nombre).join(', ');

  const irA = (pagina: number) => {
    if (reducirMovimiento) pager.current?.setPageWithoutAnimation(pagina);
    else pager.current?.setPage(pagina);
  };

  // Si la planta cambia de fase mientras se ve la pantalla, el carrusel la sigue.
  useEffect(() => {
    if (reducirMovimiento) pager.current?.setPageWithoutAnimation(planta.fase - 1);
    else pager.current?.setPage(planta.fase - 1);
  }, [planta.fase, reducirMovimiento]);

  return (
    <View className="items-center">
      <PagerView
        ref={pager}
        initialPage={planta.fase - 1}
        onPageSelected={(e) => setVista(e.nativeEvent.position)}
        style={{ width: '100%', height: tamano }}
      >
        {FASES.map((fase) => {
          const estado = estadoFase(fase, planta.fase);
          const bloqueada = estado === 'bloqueada';
          // Los objetos puestos no se nombran en pantalla, pero el lector de pantalla sí los dice.
          const objetos =
            estado === 'actual' && lleva ? formatear(es.jardin.lleva, { lista: lleva }) : null;
          const descripcion = [descripcionPlanta(planta.area, fase), objetos]
            .filter(Boolean)
            .join('. ');
          return (
            <View
              key={fase}
              accessible
              accessibilityRole="image"
              accessibilityLabel={bloqueada ? t.faseBloqueada : descripcion}
              className="items-center justify-center"
            >
              <View style={{ width: tamano, height: tamano }}>
                {bloqueada ? (
                  <>
                    <Image
                      source={imagenPlanta(planta.area, fase)}
                      contentFit="contain"
                      tintColor={colors.divisor}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <View className="absolute inset-0 items-center justify-center gap-2 px-4">
                      <View className="h-12 w-12 items-center justify-center rounded-chip bg-campo">
                        <Lock size={24} color={colors.ink} />
                      </View>
                      <AppText variant="small" weight="semibold" className="text-center">
                        {t.faseBloqueada}
                      </AppText>
                    </View>
                  </>
                ) : (
                  <PlantImage
                    area={planta.area}
                    fase={fase}
                    equipados={estado === 'actual' ? planta.equipados : []}
                  />
                )}
              </View>
            </View>
          );
        })}
      </PagerView>

      {children}

      <View className="flex-row">
        {FASES.map((fase, i) => {
          const activa = vista === i;
          const bloqueada = estadoFase(fase, planta.fase) === 'bloqueada';
          return (
            <Pressable
              key={fase}
              accessibilityRole="button"
              accessibilityLabel={
                bloqueada
                  ? t.faseBloqueada
                  : formatear(t.verFase, { fase: es.jardin.fases[fase - 1] })
              }
              accessibilityState={{ selected: activa }}
              onPress={() => irA(i)}
              className="h-12 w-12 items-center justify-center"
            >
              <View
                // Se vuelve a crear al cambiar: si solo cambia el fondo, Android pierde el radio.
                key={activa ? 'activa' : 'inactiva'}
                style={{
                  width: activa ? 16 : 10,
                  height: activa ? 16 : 10,
                  borderRadius: 8,
                  backgroundColor: activa ? colors.accent : colors.borde,
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
