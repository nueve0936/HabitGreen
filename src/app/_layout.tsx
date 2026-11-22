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
import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfileErrorView } from '@/features/auth/components/profile-error-view';
import { SessionProvider } from '@/features/auth/session-provider';
import type { AppZone } from '@/features/auth/domain/session-route';
import { useAppZone } from '@/features/auth/use-app-zone';
import { prepararAvisos } from '@/features/reminders/avisos';

SplashScreen.preventAutoHideAsync().catch(() => {
  // En recargas rápidas la pantalla de carga ya puede estar oculta.
});

// Sin internet, Supabase reporta que no pudo renovar la sesión y lo reintenta solo. La app funciona
// sin conexión (SDD 3.4), así que en desarrollo no se muestra como error en pantalla.
LogBox.ignoreLogs(['AuthRetryableFetchError']);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_500Medium,
    LexendDeca_600SemiBold,
    LexendDeca_700Bold,
  });
  // Si la fuente falla se sigue con la del sistema (definición 8: respaldo del sistema).
  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    prepararAvisos().catch(() => {
      // Sin canal la app funciona igual; solo no llegarían los avisos.
    });
  }, []);

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        {fontsReady ? <RootNavigator /> : null}
      </SessionProvider>
    </SafeAreaProvider>
  );
}

type ZonaVisible = Exclude<AppZone, 'loading'>;

function RootNavigator() {
  const zonaActual = useAppZone();
  // Última zona ya resuelta. Al iniciar sesión hay un momento de «loading» mientras se carga el
  // perfil: en vez de dejar la pantalla en blanco (se veía como un parpadeo), se sigue mostrando
  // la zona anterior hasta que la nueva esté lista.
  const [ultimaZona, setUltimaZona] = useState<ZonaVisible | null>(null);
  if (zonaActual !== 'loading' && zonaActual !== ultimaZona) setUltimaZona(zonaActual);
  const zone = zonaActual === 'loading' ? ultimaZona : zonaActual;

  useEffect(() => {
    if (zone !== null) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [zone]);

  // Al abrir la app, mientras se lee la sesión guardada sigue visible la pantalla de carga nativa.
  if (zone === null) return null;
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
        <Stack.Screen name="tienda" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="planta/[categoria]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="plan-nuevo" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="detalle-plan/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="detalle-plan/sugerencias" options={{ animation: 'slide_from_right' }} />
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
