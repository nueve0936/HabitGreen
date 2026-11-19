import { Check, ChevronDown, ListFilter } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { ICONO_CATEGORIA } from '@/features/habits/categoria-icono';
import { es, formatear } from '@/i18n/es';
import type { Area } from '@/schemas/onboarding';
import { cardShadow, colors, tintes } from '@/theme';

// Filtro por área de Semanal y Mensual (decisión del usuario: opción B de las maquetas). Un campo
// select con «Todos» o el área elegida; al tocarlo sale una hoja inferior, como la de la Tienda,
// con «Todos» y las áreas que tienen hábitos en el periodo. Elegir una opción la aplica y cierra la
// hoja; tocar fuera o «atrás» la cierra sin cambiar nada. Las filas miden 56 dp para el pulgar.

export type AreaSelectProps = {
  areas: readonly Area[];
  /** `null` = «Todos». */
  valor: Area | null;
  onCambiar: (area: Area | null) => void;
};

const nombre = (area: Area | null) =>
  area === null ? es.estadisticas.filtro.todos : es.onboarding.formulario.areas[area];

function IconoArea({ area }: { area: Area | null }) {
  const Icono = area === null ? ListFilter : ICONO_CATEGORIA[area];
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: area === null ? colors['accent-claro'] : tintes[area],
      }}
      className="items-center justify-center"
    >
      <Icono size={16} color={colors.ink} />
    </View>
  );
}

function Opcion({
  area,
  elegida,
  onPress,
}: {
  area: Area | null;
  elegida: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={nombre(area)}
      accessibilityState={{ checked: elegida }}
      onPress={onPress}
      style={{ minHeight: 56, paddingHorizontal: 10, gap: 12 }}
      className={`flex-row items-center rounded-field ${
        elegida ? 'bg-accent-claro' : 'active:bg-accent-claro'
      }`}
    >
      <IconoArea area={area} />
      <AppText weight={elegida ? 'bold' : 'medium'} className="flex-1">
        {nombre(area)}
      </AppText>
      {elegida ? <Check size={20} strokeWidth={2.5} color={colors.ink} /> : null}
    </Pressable>
  );
}

export function AreaSelect({ areas, valor, onCambiar }: AreaSelectProps) {
  const t = es.estadisticas.filtro;
  const insets = useSafeAreaInsets();
  const reducirMovimiento = useReducedMotion();
  const [abierta, setAbierta] = useState(false);

  const elegir = (area: Area | null) => {
    setAbierta(false);
    if (area !== valor) onCambiar(area);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={formatear(t.campoA11y, { area: nombre(valor) })}
        accessibilityState={{ expanded: abierta }}
        onPress={() => setAbierta(true)}
        style={{ minHeight: 48, paddingLeft: 12, paddingRight: 12, gap: 10 }}
        className="flex-row items-center rounded-field border-2 border-borde bg-campo active:bg-accent-claro"
      >
        {valor === null ? <ListFilter size={20} color={colors.ink} /> : <IconoArea area={valor} />}
        <AppText weight={valor === null ? 'regular' : 'semibold'} className="flex-1">
          {nombre(valor)}
        </AppText>
        <ChevronDown size={20} color={colors.ink} />
      </Pressable>

      <Modal
        visible={abierta}
        transparent
        animationType={reducirMovimiento ? 'none' : 'slide'}
        onRequestClose={() => setAbierta(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.cerrar}
          onPress={() => setAbierta(false)}
          className="flex-1 bg-ink/40"
        />
        <View
          accessibilityViewIsModal
          style={[
            cardShadow,
            { paddingHorizontal: 16, paddingTop: 24, paddingBottom: insets.bottom + 16, gap: 8 },
          ]}
          className="rounded-t-card bg-campo"
        >
          <AppText variant="h3" accessibilityRole="header" style={{ paddingHorizontal: 10 }}>
            {t.titulo}
          </AppText>
          <View accessibilityRole="radiogroup" style={{ gap: 2 }}>
            {[null, ...areas].map((area) => (
              <Opcion
                key={area ?? 'todos'}
                area={area}
                elegida={area === valor}
                onPress={() => elegir(area)}
              />
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}
