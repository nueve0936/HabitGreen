import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert as AlertNativo, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useSession } from '@/features/auth/session-context';
import { es } from '@/i18n/es';

// Pantalla «Empezar» del mockup: se ve justo después de confirmar la cuenta. La sesión ya está
// iniciada, así que la flecha atrás pregunta si quiere salir de la cuenta y, al confirmar, cierra
// sesión: el layout raíz lleva entonces a la bienvenida.

export default function EmpezarScreen() {
  const t = es.onboarding.empezar;
  const { signOut } = useSession();

  const salir = () =>
    AlertNativo.alert(t.salirTitulo, t.salirMensaje, [
      { text: t.cancelar, style: 'cancel' },
      { text: t.salir, style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <Screen scroll contentClassName="justify-between pt-2">
      <View className="-ml-4 self-start">
        <BackButton onPress={salir} />
      </View>
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
