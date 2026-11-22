import { useState } from 'react';
import { type TextLayoutEvent, View } from 'react-native';

import { AppText, type AppTextProps, type TextWeight } from './app-text';

// Texto que se pone en negritas al elegirse sin mover nada alrededor. Una copia invisible en
// negritas reserva el ancho y el alto, y la versión visible va encima. La visible usa los mismos
// saltos de línea que la copia en negritas: si no, un texto que en normal cabe en una línea y en
// negritas ocupa dos dejaría un renglón vacío abajo y saltaría al elegirse.

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
  // Renglones de la copia en negritas, junto con el texto del que salieron.
  const [renglones, setRenglones] = useState<{ de: string; texto: string } | null>(null);

  const alMedir = (e: TextLayoutEvent) => {
    const texto = e.nativeEvent.lines.map((l) => l.text.replace(/\s+$/, '')).join('\n');
    setRenglones((previo) =>
      previo?.de === children && previo.texto === texto ? previo : { de: children, texto },
    );
  };

  // Con un límite de renglones (barra de pestañas) el texto se corta igual en los dos pesos.
  const visible =
    props.numberOfLines === undefined && renglones?.de === children ? renglones.texto : children;

  return (
    <View>
      <AppText
        {...props}
        weight="bold"
        className={`opacity-0 ${className}`}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        onTextLayout={alMedir}
      >
        {children}
      </AppText>
      <AppText
        {...props}
        weight={bold ? 'bold' : weight}
        accessibilityLabel={children}
        className={`absolute inset-0 ${className}`}
      >
        {visible}
      </AppText>
    </View>
  );
}
