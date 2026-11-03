import { View } from 'react-native';

import { AppText, type AppTextProps, type TextWeight } from './app-text';

// Texto que se pone en negritas al elegirse sin mover nada alrededor. Una copia invisible en
// negritas reserva el ancho (y los saltos de línea) y la versión visible va encima: así el cambio
// de peso no empuja el texto ni los elementos vecinos.

export type StableBoldTextProps = Omit<AppTextProps, 'weight' | 'children'> & {
  children: string;
  bold: boolean;
  /** Peso cuando no está en negritas. */
  weight?: TextWeight;
};

export function StableBoldText({
  children,
  bold,
  weight = 'medium',
  className = '',
  ...props
}: StableBoldTextProps) {
  return (
    <View>
      <AppText
        {...props}
        weight="bold"
        className={`opacity-0 ${className}`}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </AppText>
      <AppText
        {...props}
        weight={bold ? 'bold' : weight}
        className={`absolute inset-0 ${className}`}
      >
        {children}
      </AppText>
    </View>
  );
}
