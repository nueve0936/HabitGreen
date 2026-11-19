import { Check, EllipsisVertical, Pause } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, View, type HostInstance } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { es, formatear } from '@/i18n/es';
import { cardShadow, colors } from '@/theme';

import { textoDuracion } from '../domain/formato';
import { horaCorta } from '../domain/horario';
import type { Ancla } from './habit-menu';

// Tarjeta de hábito de Hoy y Hábitos (mockups «Pantalla Dashboard» y «Hábitos #1»): casilla
// redonda, título y «08:00 · 30 min». Hecho: casilla rellena de `accent` con ✓ y título tachado (no
// depende solo del color). Si no toca hoy, la casilla es punteada y lo dice con texto. En pausa
// (mockup «Hábitos #3»): el símbolo ⏸ en lugar de la casilla y título tachado; se reanuda desde el
// menú ⋮.

export type HabitCheckCardProps = {
  titulo: string;
  hora: string | null;
  duracionMin: number;
  hecho: boolean;
  /** Toca hoy: solo entonces se puede marcar. */
  marcable: boolean;
  enPausa?: boolean;
  /** Llegó a hoy por una reprogramación (SDD 6.2). */
  reprogramado?: boolean;
  ocupado?: boolean;
  onAlternar: () => void;
  /** Abre el menú ⋮ (solo en Hábitos) con la posición del botón para anclar el globo. */
  onOpciones?: (ancla: Ancla) => void;
  /** El globo de este hábito está abierto: el ⋮ se marca. */
  menuAbierto?: boolean;
  onPress?: () => void;
  /** Algo pequeño junto al ⋮, como la racha en Progreso. Hoy y Hábitos no lo usan. */
  accesorio?: ReactNode;
};

export function HabitCheckCard({
  titulo,
  hora,
  duracionMin,
  hecho,
  marcable,
  enPausa = false,
  reprogramado = false,
  ocupado = false,
  onAlternar,
  onOpciones,
  menuAbierto = false,
  onPress,
  accesorio,
}: HabitCheckCardProps) {
  const t = es.habitos;
  const [unRenglon, setUnRenglon] = useState(true);
  const botonMenu = useRef<HostInstance>(null);
  const tachado = hecho || enPausa;

  const abrirMenu = () =>
    botonMenu.current?.measureInWindow((x, y, ancho, alto) => onOpciones?.({ x, y, ancho, alto }));
  const detalle = [horaCorta(hora), duracionMin > 0 ? textoDuracion(duracionMin) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      style={cardShadow}
      disabled={!onPress}
      onPress={onPress}
      // Sin acción propia (Hoy) no agrupa: el lector recorre el título y la casilla por separado.
      accessible={Boolean(onPress)}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${titulo}, ${detalle}` : undefined}
      accessibilityHint={onPress ? t.menu.editar : undefined}
      className={`flex-row items-center gap-3 rounded-card bg-campo py-2 pl-2 pr-1 ${
        onPress ? 'active:bg-accent-claro' : ''
      }`}
    >
      {enPausa ? (
        <View
          accessible
          accessibilityLabel={formatear(t.pausado, { titulo })}
          className="h-12 w-12 items-center justify-center"
        >
          <Pause size={24} color={colors.ink} strokeWidth={2.5} />
        </View>
      ) : (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={formatear(hecho ? t.marcado : t.sinMarcar, { titulo })}
          accessibilityHint={marcable ? undefined : t.noTocaHoy}
          accessibilityState={{ checked: hecho, disabled: !marcable || ocupado, busy: ocupado }}
          disabled={!marcable || ocupado}
          onPress={onAlternar}
          hitSlop={4}
          className="h-12 w-12 items-center justify-center"
        >
          <View
            className={`h-7 w-7 items-center justify-center rounded-chip border-2 ${
              hecho
                ? 'border-accent bg-accent'
                : marcable
                  ? 'border-borde bg-campo'
                  : 'border-dashed border-borde'
            }`}
          >
            {hecho ? <Check size={18} color={colors.blanco} strokeWidth={3} /> : null}
          </View>
        </Pressable>
      )}

      <View className="flex-1 gap-1 py-1">
        {/* El tachado nativo de Android casi no se ve con Lexend: en un renglón se dibuja una
            línea propia de 2 px que sobresale un poco (captura del usuario); en varios renglones
            se usa el nativo, que sí marca cada renglón. */}
        <View className="self-start">
          <AppText
            weight="bold"
            tone={tachado ? 'ink-soft' : 'ink'}
            onTextLayout={(e) => setUnRenglon(e.nativeEvent.lines.length <= 1)}
            style={tachado && !unRenglon ? { textDecorationLine: 'line-through' } : undefined}
          >
            {titulo}
          </AppText>
          {tachado && unRenglon ? (
            <View
              pointerEvents="none"
              className="absolute -left-1 -right-1 top-1/2 h-0.5 -translate-y-px rounded-chip bg-ink-soft"
            />
          ) : null}
        </View>
        <AppText variant="small" tone="ink-soft">
          {detalle}
        </AppText>
        {reprogramado ? (
          <AppText variant="small" tone="ink-soft">
            {es.reprogramar.reprogramadoHoy}
          </AppText>
        ) : null}
        {!enPausa && !marcable ? (
          <AppText variant="small" tone="ink-soft">
            {t.noTocaHoy}
          </AppText>
        ) : null}
      </View>

      {accesorio}

      {onOpciones ? (
        <Pressable
          ref={botonMenu}
          accessibilityRole="button"
          accessibilityLabel={formatear(t.opciones, { titulo })}
          accessibilityState={{ expanded: menuAbierto }}
          onPress={abrirMenu}
          className={`h-12 w-12 items-center justify-center rounded-field active:bg-accent-claro ${
            menuAbierto ? 'bg-accent-claro' : ''
          }`}
        >
          <EllipsisVertical size={24} color={colors.ink} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
