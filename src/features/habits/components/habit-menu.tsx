import { Pause, Pencil, Play, Trash2, type LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { es } from '@/i18n/es';
import { colors } from '@/theme';

// Menú ⋮ de un hábito (mockup «Hábitos: menú de tres puntos»): Editar, Pausar o Reanudar y
// Eliminar. Es una hoja inferior: más fácil de alcanzar con el pulgar y de leer con TalkBack.

export type HabitMenuProps = {
  titulo: string | null;
  activo: boolean;
  onCerrar: () => void;
  onEditar: () => void;
  onCambiarActivo: () => void;
  onEliminar: () => void;
};

function Opcion({
  icono: Icono,
  label,
  onPress,
}: {
  icono: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-12 flex-row items-center gap-3 rounded-field px-2 active:bg-bg-claro"
    >
      <Icono size={22} color={colors.ink} />
      <AppText weight="semibold">{label}</AppText>
    </Pressable>
  );
}

export function HabitMenu({
  titulo,
  activo,
  onCerrar,
  onEditar,
  onCambiarActivo,
  onEliminar,
}: HabitMenuProps) {
  const t = es.habitos.menu;
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={titulo !== null} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.cerrar}
        onPress={onCerrar}
        className="flex-1 bg-ink/40"
      />
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="gap-1 rounded-t-card border-t-2 border-ink bg-campo px-4 pt-4"
      >
        <AppText variant="h3" className="mb-2 px-2">
          {titulo ?? ''}
        </AppText>
        <Opcion icono={Pencil} label={t.editar} onPress={onEditar} />
        <Opcion
          icono={activo ? Pause : Play}
          label={activo ? t.pausar : t.reanudar}
          onPress={onCambiarActivo}
        />
        <Opcion icono={Trash2} label={t.eliminar} onPress={onEliminar} />
      </View>
    </Modal>
  );
}
