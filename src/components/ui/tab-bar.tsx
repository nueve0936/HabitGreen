import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import {
  ChartColumn,
  House,
  Sprout,
  SquareCheckBig,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { es } from '@/i18n/es';
import { colors } from '@/theme';

import { StableBoldText } from './stable-bold-text';

// Barra inferior con las 5 pestañas del SDD. La activa se marca con una píldora detrás del icono y
// texto en negrita: no depende solo del color.

const TABS: Record<string, { label: string; Icon: LucideIcon }> = {
  hoy: { label: es.tabs.hoy, Icon: House },
  habitos: { label: es.tabs.habitos, Icon: SquareCheckBig },
  estadisticas: { label: es.tabs.estadisticas, Icon: ChartColumn },
  jardin: { label: es.tabs.jardin, Icon: Sprout },
  perfil: { label: es.tabs.perfil, Icon: UserRound },
};

export function TabBar({ state, emitter, navigateToTab }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      className="flex-row border-t border-divisor bg-campo pt-2"
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const { Icon, label } = tab;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            className="min-h-14 flex-1 items-center justify-center gap-0.5 active:opacity-70"
          >
            <View
              // Se vuelve a crear al cambiar de estado: si solo cambia el fondo de la vista ya creada,
              // Android dibuja la píldora con las esquinas rectas.
              key={focused ? 'activa' : 'inactiva'}
              style={{
                borderRadius: 16,
                backgroundColor: focused ? colors['accent-claro'] : 'transparent',
              }}
              className="h-8 w-14 items-center justify-center"
            >
              <Icon
                size={24}
                color={focused ? colors.accent : colors.ink}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
            <StableBoldText
              variant="small"
              bold={focused}
              weight="regular"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              className="text-[12px] leading-[18px]"
            >
              {label}
            </StableBoldText>
          </Pressable>
        );
      })}
    </View>
  );
}
