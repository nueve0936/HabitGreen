import { ChevronRight, Pause, Pencil, Play, Trash2, type LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';

import { AppText, type TextTone } from '@/components/ui/app-text';
import { es } from '@/i18n/es';
import { cardShadow, colors } from '@/theme';

// Menú ⋮ de un hábito (mockups «Hábitos #2» y «#3.1 Reanudar hábito»): un globo pegado a los
// tres puntos con Editar, Pausar o Reanudar y Eliminar. Se abre hacia abajo y, si no cabe, hacia
// arriba. Tocar fuera lo cierra. El detalle del plan agrega opciones después de Editar («Hacerlo más
// ligero», «Sacar del plan»).

/** Posición del botón ⋮ en la ventana (medida con measureInWindow). */
export type Ancla = { x: number; y: number; ancho: number; alto: number };

export type HabitMenuProps = {
  ancla: Ancla | null;
  activo: boolean;
  onCerrar: () => void;
  onEditar: () => void;
  onCambiarActivo: () => void;
  onEliminar: () => void;
  /** Opciones extra después de Editar. */
  extras?: readonly { icono: LucideIcon; label: string; onPress: () => void }[];
};

const ANCHO = 168;
/** Más ancho con opciones extra: «Hacerlo más ligero» no cabe en 168. */
const ANCHO_CON_EXTRAS = 208;
const ALTO_OPCION = 48;
const MARGEN = 8;

function Opcion({
  icono: Icono,
  label,
  tono = 'ink',
  onPress,
}: {
  icono: LucideIcon;
  label: string;
  tono?: Extract<TextTone, 'ink' | 'peligro'>;
  onPress: () => void;
}) {
  const color = tono === 'peligro' ? colors.peligro : colors.ink;
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-12 flex-row items-center gap-2 rounded-field px-2 active:bg-accent-claro"
    >
      <Icono size={18} color={color} />
      <AppText variant="small" weight="semibold" tone={tono} className="flex-1">
        {label}
      </AppText>
      <ChevronRight size={16} color={color} />
    </Pressable>
  );
}

export function HabitMenu({
  ancla,
  activo,
  onCerrar,
  onEditar,
  onCambiarActivo,
  onEliminar,
  extras = [],
}: HabitMenuProps) {
  const t = es.habitos.menu;
  const ventana = useWindowDimensions();
  if (ancla === null) return null;

  const derecha = Math.max(MARGEN, ventana.width - (ancla.x + ancla.ancho));
  // Crece con la letra del sistema para que las opciones no se partan, sin salirse de la pantalla.
  const base = extras.length > 0 ? ANCHO_CON_EXTRAS : ANCHO;
  const ancho = Math.min(base * Math.max(1, ventana.fontScale), ventana.width - derecha - MARGEN);
  const altoEstimado = (3 + extras.length) * ALTO_OPCION + 16;
  const cabeAbajo = ancla.y + ancla.alto + altoEstimado + MARGEN < ventana.height;
  const vertical = cabeAbajo
    ? { top: ancla.y + ancla.alto + 4 }
    : { bottom: ventana.height - ancla.y + 4 };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onCerrar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.cerrar}
        onPress={onCerrar}
        className="absolute inset-0"
      />
      <View
        accessibilityRole="menu"
        style={[cardShadow, { position: 'absolute', right: derecha, width: ancho, ...vertical }]}
        className="rounded-card bg-campo p-2"
      >
        <Opcion icono={Pencil} label={t.editar} onPress={onEditar} />
        <View className="mx-2 h-px bg-divisor" />
        {extras.map((extra) => (
          <View key={extra.label}>
            <Opcion icono={extra.icono} label={extra.label} onPress={extra.onPress} />
            <View className="mx-2 h-px bg-divisor" />
          </View>
        ))}
        <Opcion
          icono={activo ? Pause : Play}
          label={activo ? t.pausar : t.reanudar}
          onPress={onCambiarActivo}
        />
        <View className="mx-2 h-px bg-divisor" />
        <Opcion icono={Trash2} label={t.eliminar} tono="peligro" onPress={onEliminar} />
      </View>
    </Modal>
  );
}
