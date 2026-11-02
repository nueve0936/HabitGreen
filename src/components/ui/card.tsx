import { Pressable, type PressableProps, View, type ViewProps } from 'react-native';

import { cardShadow } from '@/theme';

// Tarjeta del SDD 9.3: fondo surface, borde surface-oscuro, radio 16 y sombra suave.
// Si recibe onPress se vuelve presionable (presionada: surface-claro).

const BASE_CLASS = 'rounded-card border border-surface-oscuro bg-surface p-4';

type StaticCardProps = ViewProps & { className?: string; onPress?: undefined };
type PressableCardProps = Omit<PressableProps, 'style'> & {
  className?: string;
  onPress: NonNullable<PressableProps['onPress']>;
};

export type CardProps = StaticCardProps | PressableCardProps;

export function Card(props: CardProps) {
  if (props.onPress) {
    const { className = '', ...rest } = props;
    return (
      <Pressable
        accessibilityRole="button"
        style={cardShadow}
        className={`${BASE_CLASS} active:bg-surface-claro ${className}`}
        {...rest}
      />
    );
  }
  const { className = '', style, ...rest } = props;
  return <View style={[cardShadow, style]} className={`${BASE_CLASS} ${className}`} {...rest} />;
}
