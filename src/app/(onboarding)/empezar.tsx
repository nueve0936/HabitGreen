import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { es } from '@/i18n/es';

// Pantalla «Empezar» del mockup: se ve justo después de confirmar la cuenta.

export default function EmpezarScreen() {
  const t = es.onboarding.empezar;

  return (
    <Screen scroll contentClassName="justify-between pt-12">
      <View className="items-center gap-6">
        <Image
          source={require('../../../assets/illustrations/empezar.png')}
          accessibilityLabel={t.ilustracion}
          contentFit="contain"
          style={{ width: '100%', aspectRatio: 1776 / 1354 }}
        />
        <AppText variant="h1" weight="semibold" className="text-center">
          {t.titulo}
        </AppText>
        <AppText variant="body" className="text-center">
          {t.descripcion}
        </AppText>
      </View>

      <Button label={t.boton} onPress={() => router.push('/modo')} className="mt-10" />
    </Screen>
  );
}
