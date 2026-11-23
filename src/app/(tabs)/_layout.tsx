import { TopTabs } from 'expo-router/js-top-tabs';

import { TabBar } from '@/components/ui/tab-bar';
import { useSession } from '@/features/auth/session-context';
import { useAvisos } from '@/features/reminders/use-avisos';
import { useHechoDesdeAviso } from '@/features/reminders/use-hecho-desde-aviso';
import { es } from '@/i18n/es';
import { useCambioDeDia } from '@/lib/use-cambio-de-dia';
import { useSync } from '@/sync/use-sync';

// Las 5 pestañas del SDD 9.1: se cambia tocando la barra o deslizando en horizontal (TopTabs, con
// la barra abajo). La barra es propia para seguir el mockup y las reglas de accesibilidad (estado
// activo con indicador, icono y negrita). Aquí se montan la sincronización y los avisos:
// solo corre cuando el usuario ya terminó el onboarding y está en las pestañas. También se vigila
// el cambio de día con la app abierta y se atiende el botón «Hecho» de los avisos.

export const unstable_settings = {
  initialRouteName: 'hoy',
};

export default function TabsLayout() {
  const { session } = useSession();
  useSync(session?.user.id ?? null);
  useAvisos(session?.user.id ?? null);
  useHechoDesdeAviso();
  useCambioDeDia();

  return (
    <TopTabs tabBarPosition="bottom" tabBar={(props) => <TabBar {...props} />}>
      <TopTabs.Screen name="hoy" options={{ title: es.tabs.hoy }} />
      <TopTabs.Screen name="habitos" options={{ title: es.tabs.habitos }} />
      <TopTabs.Screen name="estadisticas" options={{ title: es.tabs.estadisticas }} />
      <TopTabs.Screen name="jardin" options={{ title: es.tabs.jardin }} />
      <TopTabs.Screen name="perfil" options={{ title: es.tabs.perfil }} />
    </TopTabs>
  );
}
