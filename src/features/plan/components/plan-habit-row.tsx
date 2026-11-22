import { EllipsisVertical, Feather, Flame } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, View, type HostInstance } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { Ancla } from '@/features/habits/components/habit-menu';
import { textoHabito } from '@/features/habits/domain/formato';
import { es, formatear } from '@/i18n/es';
import { useAccionUnica } from '@/lib/use-accion-unica';
import { colors } from '@/theme';

// Fila de un hábito en el detalle del plan: título, días, hora y duración («Sin duración fija» si
// es un recordatorio), su racha y «En pausa» si lo está. Tocarla abre la edición del hábito; el ⋮
// abre sus acciones (más ligero, sacar del plan, pausar, eliminar).

export type PlanHabitRowProps = {
  titulo: string;
  diasSemana: readonly number[];
  hora: string | null;
  duracionMin: number;
  racha: number;
  enPausa: boolean;
  menuAbierto: boolean;
  onPress: () => void;
  onOpciones: (ancla: Ancla) => void;
  /** Si va por debajo del 50 %, un enlace suave para hacerlo más ligero. */
  onMasLigero?: () => void;
  /** Línea divisoria arriba (todas menos la primera). */
  conDivisor: boolean;
};

export function PlanHabitRow({
  titulo,
  diasSemana,
  hora,
  duracionMin,
  racha,
  enPausa,
  menuAbierto,
  onPress,
  onOpciones,
  onMasLigero,
  conDivisor,
}: PlanHabitRowProps) {
  const t = es.perfil.detallePlan;
  const botonMenu = useRef<HostInstance>(null);
  // Un toque doble rápido no abre la edición, el menú ni el diálogo dos veces.
  const abrir = useAccionUnica(onPress);
  const masLigero = useAccionUnica(onMasLigero);
  const opciones = useAccionUnica(() =>
    botonMenu.current?.measureInWindow((x, y, ancho, alto) => onOpciones({ x, y, ancho, alto })),
  );
  const detalle = [
    textoHabito({ dias_semana: diasSemana, hora, duracion_min: duracionMin }, es.habitos.tarjeta),
    duracionMin === 0 ? t.sinDuracion : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className={conDivisor ? 'border-t border-divisor' : ''}>
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={[
            formatear(t.abrir, { titulo }),
            detalle,
            enPausa ? t.enPausa : null,
            racha > 0 ? formatear(t.rachaA11y, { n: String(racha) }) : null,
          ]
            .filter(Boolean)
            .join('. ')}
          onPress={abrir}
          className="min-h-16 flex-1 justify-center gap-1 py-3 pl-4 pr-2 active:bg-accent-claro"
        >
          <AppText weight="semibold" tone={enPausa ? 'ink-soft' : 'ink'}>
            {titulo}
          </AppText>
          <AppText variant="small" tone="ink-soft">
            {detalle}
          </AppText>
          {enPausa || racha > 0 ? (
            <View className="flex-row flex-wrap items-center gap-3">
              {enPausa ? (
                <AppText variant="small" weight="semibold" tone="ink-soft">
                  {t.enPausa}
                </AppText>
              ) : null}
              {racha > 0 ? (
                <View className="flex-row items-center gap-1">
                  <Flame size={14} color={colors.accent} />
                  <AppText variant="small" weight="semibold" tone="acento">
                    {formatear(t.racha, { n: String(racha) })}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </Pressable>
        <Pressable
          ref={botonMenu}
          accessibilityRole="button"
          accessibilityLabel={formatear(es.habitos.opciones, { titulo })}
          accessibilityState={{ expanded: menuAbierto }}
          onPress={opciones}
          className={`mr-2 h-12 w-12 items-center justify-center rounded-field active:bg-accent-claro ${
            menuAbierto ? 'bg-accent-claro' : ''
          }`}
        >
          <EllipsisVertical size={24} color={colors.ink} />
        </Pressable>
      </View>
      {masLigero ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={formatear(t.sugerirMasLigeroA11y, { titulo })}
          onPress={masLigero}
          className="min-h-12 flex-row items-center gap-2 self-start px-4 pb-2 active:opacity-70"
        >
          <Feather size={16} color={colors.accent} />
          <AppText variant="small" weight="semibold" tone="acento">
            {t.sugerirMasLigero}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
