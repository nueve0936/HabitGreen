import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { es } from '@/i18n/es';

import { useSession } from '../session-context';

// Estado de error cuando hay sesión pero no se pudo leer el perfil (por ejemplo, sin red).

export function ProfileErrorView() {
  const { reloadProfile, signOut } = useSession();

  return (
    <Screen contentClassName="justify-center gap-6">
      <Alert variant="error" message={`${es.sesion.errorPerfil} ${es.comun.sinConexion}`} />
      <View className="gap-2">
        <Button label={es.comun.reintentar} onPress={reloadProfile} />
        <Button variant="tertiary" label={es.perfil.cerrarSesion} onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}
