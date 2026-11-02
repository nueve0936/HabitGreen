import { Tabs } from 'expo-router';

import { TabBar } from '@/components/ui/tab-bar';
import { es } from '@/i18n/es';

// Las 5 pestañas del SDD 9.1. La barra es propia para seguir el mockup y las reglas de
// accesibilidad (estado activo con indicador, icono y negrita).

export const unstable_settings = {
  initialRouteName: 'hoy',
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="hoy" options={{ title: es.tabs.hoy }} />
      <Tabs.Screen name="habitos" options={{ title: es.tabs.habitos }} />
      <Tabs.Screen name="estadisticas" options={{ title: es.tabs.estadisticas }} />
      <Tabs.Screen name="jardin" options={{ title: es.tabs.jardin }} />
      <Tabs.Screen name="perfil" options={{ title: es.tabs.perfil }} />
    </Tabs>
  );
}
