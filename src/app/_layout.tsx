import '../../global.css';

import {
  LexendDeca_400Regular,
  LexendDeca_500Medium,
  LexendDeca_600SemiBold,
  LexendDeca_700Bold,
  useFonts,
} from '@expo-google-fonts/lexend-deca';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfileErrorView } from '@/features/auth/components/profile-error-view';
import { SessionProvider } from '@/features/auth/session-provider';
import { useAppZone } from '@/features/auth/use-app-zone';

SplashScreen.preventAutoHideAsync().catch(() => {
  // En recargas rápidas la pantalla de carga ya puede estar oculta.
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_500Medium,
    LexendDeca_600SemiBold,
    LexendDeca_700Bold,
  });
  // Si la fuente falla se sigue con la del sistema (definición 8: respaldo del sistema).
  const fontsReady = fontsLoaded || fontError !== null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        {fontsReady ? <RootNavigator /> : null}
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const zone = useAppZone();

  useEffect(() => {
    if (zone !== 'loading') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [zone]);

  // Mientras se lee la sesión guardada sigue visible la pantalla de carga nativa.
  if (zone === 'loading') return null;
  if (zone === 'profile-error') return <ProfileErrorView />;

  // Cada zona solo deja entrar a sus pantallas. Al cambiar la sesión, Expo Router lleva al
  // usuario a la primera pantalla disponible: `index`, que siempre existe y redirige a la
  // primera pantalla de la zona actual.
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={zone === 'tabs'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit/nuevo" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="habit/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>
      <Stack.Protected guard={zone === 'onboarding'}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={zone === 'recovery'}>
        <Stack.Screen name="nueva-contrasena" />
      </Stack.Protected>
      <Stack.Protected guard={zone === 'auth'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="auth-callback" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
