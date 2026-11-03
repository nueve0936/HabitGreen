import { Image } from 'expo-image';
import { Modal, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { es, formatear } from '@/i18n/es';
import type { Area } from '@/schemas/onboarding';

import { imagenPlanta } from '../imagenes';

// Celebración del cambio de fase de una planta (SDD 6.1 y textos 3). Es el único momento en que
// el progreso oculto se hace visible, sin números.

export type Celebracion = { area: Area; fase: number };

export function PhaseCelebration({
  celebracion,
  onCerrar,
}: {
  celebracion: Celebracion | null;
  onCerrar: () => void;
}) {
  const t = es.recompensas;
  const categoria = celebracion ? es.onboarding.formulario.areas[celebracion.area] : '';
  const texto = celebracion
    ? formatear(celebracion.fase >= 3 ? t.fase3 : t.fase2, { categoria })
    : '';

  return (
    <Modal
      visible={celebracion !== null}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View className="flex-1 items-center justify-center bg-ink/40 px-8">
        <View
          accessibilityViewIsModal
          className="w-full items-center gap-6 rounded-card border-2 border-ink bg-campo p-6"
        >
          {celebracion ? (
            <View className="aspect-square w-48 overflow-hidden rounded-card border-2 border-ink bg-bg-claro">
              <Image
                source={imagenPlanta(celebracion.area, celebracion.fase)}
                contentFit="contain"
                accessible={false}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ) : null}
          <AppText variant="h3" className="text-center" accessibilityRole="header">
            {texto}
          </AppText>
          <Button label={t.genial} onPress={onCerrar} className="self-stretch" />
        </View>
      </View>
    </Modal>
  );
}
