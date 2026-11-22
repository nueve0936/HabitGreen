import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import { CommonActions } from 'expo-router/react-navigation';
import { useEffect } from 'react';
import { Alert as AlertNativo, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useSession } from '@/features/auth/session-context';
import { pilaParaRetomar } from '@/features/onboarding/domain/retomar';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { es } from '@/i18n/es';
import { navegar } from '@/lib/navegar';

// Pantalla «Empezar» del mockup: se ve justo después de confirmar la cuenta. La sesión ya está
// iniciada, así que la flecha atrás pregunta si quiere salir de la cuenta y, al confirmar, cierra
// sesión: el layout raíz lleva entonces a la bienvenida. Si la app se cerró a mitad del formulario
// o de la revisión del plan, al abrirla se vuelve ahí.
// Solo se retoma cuando Empezar es la única pantalla de la pila, es decir, al abrir la app: después
// del salto queda debajo de las demás, y al volver a ella desde «Elegir modo» ya no hay a dónde
// retomar (esa pantalla lo borra). No se usa una variable de «ya se retomó», porque si Android
// conserva el proceso al cerrar la app desde Recientes, seguiría marcada y no se retomaría.

export default function EmpezarScreen() {
  const t = es.onboarding.empezar;
  const { signOut, session } = useSession();
  const navigation = useNavigation();

  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (userId === null) return;
    // Se espera un cuadro para que la navegación termine de montarse antes del salto.
    const cuadro = requestAnimationFrame(() => {
      const actual = navigation.getState();
      if (actual?.routes.length !== 1) return;
      const { userId: dueno, retomar } = useOnboardingStore.getState();
      if (retomar === null || dueno !== userId) return;
      const rutas = pilaParaRetomar(retomar);
      // Expo Router solo acepta un reinicio con el estado completo de la pila: se copia el actual
      // (su clave, sus pantallas posibles y su contador) y solo se cambian las pantallas abiertas.
      // Las rutas nuevas reciben su clave al aplicarse.
      navigation.dispatch(
        CommonActions.reset({ ...actual, stale: false, index: rutas.length - 1, routes: rutas }),
      );
    });
    return () => cancelAnimationFrame(cuadro);
  }, [navigation, userId]);

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

      <Button label={t.boton} onPress={() => navegar.push('/modo')} className="mt-10" />
    </Screen>
  );
}
